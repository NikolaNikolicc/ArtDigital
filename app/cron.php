<?php
    require_once 'baza.php';
    error_reporting(E_ALL);
    ini_set('display_errors',1);
    ini_set('post_max_size', 0);
    ini_set('upload_max_filesize', 0);
    ini_set("memory_limit", "-1");

    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\SMTP;
    use Aws\Ses\SesClient;
    use Aws\Exception\AwsException;
    
    require 'vendor/autoload.php';

    $db = new DB();
    $db->query("SELECT data, session, id FROM slike WHERE done = 0 AND proccessing = 0 ORDER BY id DESC LIMIT 1");
    if ($db->getRowsNum() > 0) {
        $data = $db->fetch(false)[0];
        $db->query("SELECT image, size, `count` FROM uploads WHERE session_id = '".$data[1]."'");
        $images = $db->fetch(false);
        wrap($data, $images, $db, $data[2], $data[1]);
    }

    function wrap($data, $images, $db, $order_id, $session_id) {
        error_reporting(E_ALL);
        ini_set('display_errors',1);

        $db->query("UPDATE slike SET proccessing = 1 WHERE id = $order_id");

        $data = json_decode(base64_decode($data[0]), true);

        $zip = new ZipArchive();
        $zippath = trim($data['contact']['ime']) . '-' . trim($data['contact']['prezime']). '-' . time() .".zip";
        if(file_exists("/var/www/html/public_html/app/zips/".$zippath)) {
            unlink ("/var/www/html/public_html/app/zips/".$zippath); 
        }

        if ($zip->open("/var/www/html/public_html/app/zips/".$zippath, ZIPARCHIVE::CREATE) != TRUE) {
            $error = "Could not create zip";
            echo json_encode(['success'=>0, 'msg' => $error]);
            exit();
        }
        $i = 0;
        try {
            foreach($images as $img) {
                if (file_exists('/var/www/html/public_html/app/uploads/' . $img[0])) {
                    $zip->addFile('/var/www/html/public_html/app/uploads/' . $img[0], 'slika_' . $i++ . '-' . $img[1] . '-' . $img[2] . '.' .pathinfo($img[0], PATHINFO_EXTENSION));
                }
                
            }
        } catch (Exception $e) {
            echo json_encode(['success'=>0, 'msg' => $e]);
            exit();
        }
        $zip->close();

        
        $mail = formatMail(
            $data['contact']['ime'],
            $data['contact']['prezime'],
            $data['contact']['email'],
            $data['contact']['telefon'],
            $data['type'],
            $data['cena'],
            $data['akcija'],
            $data['ram'] == '0' ? 'Bez' : 'Sa',
            $data['contact']['preuzimanje'],
            $data['contact']['mesto_preuzimanja'],
            $data['contact']['adresa'],
            $data['contact']['grad'],
            $data['contact']['zip'],
            $data['contact']['poruka'],
            $zippath,
            $data['contact']['kurir'],
        );
        if (file_exists('/var/www/html/public_html/app/zips/' . $zippath)) {
            $res = sendMail($mail, $data);
            if ($res) {
                $db->query("UPDATE slike SET done = 1, zip = '".$zippath."', mail='".base64_encode($mail)."' WHERE id = $order_id");
            } else {
                $db->query("UPDATE slike SET done = 1, zip = '".$zippath."', mail='".base64_encode($mail)."' WHERE id = $order_id");
            }
            
        } else {
            $db->query("UPDATE slike SET done = 1, error=1, zip = '".$zippath."', mail='".base64_encode($mail)."' WHERE id = $order_id");
        }

        sendConfirmation($session_id);
        


    }


    function sendConfirmation($session_id) {
		$db = new DB();
		$db->query("SELECT data, id FROM slike WHERE session = '$session_id'");
		$data = $db->fetch(false)[0];
		$db->query("SELECT size, sum(count) FROM uploads WHERE session_id = '$session_id' GROUP BY size");
		$slike = $db->fetch(false);
		$id = $data[1];
		$data = json_decode(base64_decode($data[0]));
		$preuzimanje = "";
		$images = "";
		if ($data->contact->preuzimanje == 'Licno') {
			$preuzimanje = "
			<p>Mesto preuzimanja: <b>".$data->contact->mesto_preuzimanja."</b></p>
			";
		} else {
			$preuzimanje = "
			<p>Adresa: <b>".$data->contact->adresa."</b></p>
			<p>Grad: <b>".$data->contact->grad."</b></p>
			<p>Postanški broj: <b>".$data->contact->zip."</b></p>
			<p>Kurir: <b>".$data->contact->kurir."</b></p>";
		}
		$count = 0;

		foreach ($slike as $slika) {
			$images .= "<li>".ucfirst($slika[0])." - ".$slika[1]." fotografija</li>";
			$count += $slika[1];
		}

		$body = "
		<html>

			<head>
				<style>
					body {
						font-family: Arial, Helvetica, sans-serif;
						font-size: 14px;
						color: #000;
					}
					ul {
						margin: 0;
						padding: 0;
					}
					li {
						margin: 0;
						padding: 0;
						margin-left: 40px;
					}
					b {
						font-weight: bold;
					}
				</style>
			</head>

			<body>
				<p>Poštovani,</p>
				<p>Vasa porudžbina je uspešno primljena.</p>

				<p><b>Vaš kontakt</b></p>
				<p>Ime i prezime: <b>".$data->contact->ime." ".$data->contact->prezime."</b></p>
				<p>Telefon: <b>".$data->contact->telefon."</b></p>
				<p>Email: <b>".$data->contact->email."</b></p>
				$preuzimanje
				<p>Broj fotografija za izradu: <b>$count</b></p>
				<p>Formati za izradu: </p>
				<ul>
					$images
				</ul>
				<p>Tip papira: <b>$data->type</b></p>
				<p>Ukupna cena: <b>".$data->cena." RSD</b></p>
			</body>

		</html>";

		$mail = new PHPMailer(); // create a new object
		$mail->IsSMTP(); // enable SMTP
		$mail->IsHTML(true);
		$mail->CharSet = "UTF-8";
		$mail->SetFrom("poruci@fotostudioart.rs");
		$mail->FromName = "Art Digital";
		$mail->Subject = "Vaša porudžbina je uspešno primljena";
		$mail->Body = $body;
		$mail->AddAddress($data->contact->email);

		$mail->preSend();

		$raw = $mail->getSentMIMEMessage();
		$sesClient =  new SesClient([
			'version' => 'latest',
			'region'  => 'eu-north-1',
			'credentials' => [
				'key' => 'AKIAQZJBJYV3QX2O67S5',
				'secret' => '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',
			]
		]);
		$result = $sesClient->sendRawEmail([
			'RawMessage' => [
				'Data' => $raw
			]
		]);
	}


    function formatMail($ime, $prezime, $email, $tel, $vrsta, $cena, $akcija, $ram, $preuzimanje, $mesto_preuzimanja, $adresa, $grad, $zip, $poruka, $zippath, $kurir) {
        $mail= "
        <html>
            <head></head>
            <body>
                <p>Ime: %s</p>
                <p>Prezime: %s</p>
                <p>Email: %s</p>
                <p>Telefon: %s</p>
                <p>Vrsta slike: %s</p>
                <p>Cena: %s RSD</p>
                <p>Akcija: %s</p>
                <p>Beli ram: %s</p>
                <hr>";

                if ($preuzimanje == 'Licno') {
                    $mail .= "<p>Poslovnica: $mesto_preuzimanja</p>";
                } else {
                    $mail .= "
                    <p>Adresa: $adresa</p>
                    <p>Grad: $grad</p>
                    <p>Postanski broj: $zip</p>
                    <p>Kurirska sluzba: $kurir</p>
                    ";
                }
                
                $mail .= "
                    <hr><p>Dodatna poruka: %s</p><hr>
                    <p>Link: <a href='https://fotostudioart.rs/app/zips/%s'>Preuzmi zip</a></p>
                    <hr>
            </body>
        </html>";
        return sprintf($mail, $ime, $prezime, $email, $tel, $vrsta, $cena, $akcija, $ram, $poruka, $zippath);
    }

    function sendMail($body, $data, $debug = false) {
        $mail = new PHPMailer(); // create a new object
        $mail->IsSMTP(); // enable SMTP
        $mail->IsHTML(true);
        $mail->SetFrom("poruci@fotostudioart.rs");
        $mail->FromName = "Art Digital";
        $mail->Subject = "Nova porudzbina, " . date('F d Y H:i');
        $mail->Body = $body;
        $mail->AddAddress("nemanja02marjanov@gmail.com");

        if ($data['contact']['email'] == 'test@123.com') $debug = true;
        
        if (!$debug) {
            if ($data['contact']['mesto_preuzimanja'] == 'Terazije 5') {
                $mail->AddAddress("artdigital29@gmail.com");
            } else if ($data['contact']['mesto_preuzimanja'] == 'Bulevar Despota Stefana 48') {
                $mail->AddAddress("artdigital26@gmail.com");
            } else {
                $mail->AddAddress("artdigital29@gmail.com");
            }
        }

        $mail->preSend();
        // echo $mail->getSentMIMEMessage();

        $raw = $mail->getSentMIMEMessage();
        $sesClient =  new SesClient([
            'version' => 'latest',
            'region'  => 'eu-north-1',
            'credentials' => [
                'key' => 'AKIAQZJBJYV3QX2O67S5',
                'secret' => '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',
            ]
        ]);
        $result = $sesClient->sendRawEmail([
            'RawMessage' => [
                'Data' => $raw
            ]
        ]);
    }
?>