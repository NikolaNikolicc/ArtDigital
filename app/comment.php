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

    $db->query("INSERT INTO komentari (ime, prezime, komentar) VALUES ('".$_POST['ime']."', '".$_POST['prezime']."', '".$_POST['comment']."')");
    sendMail("
        <p>Ime: ".$_POST['ime']."</p>
        <p>Prezime: ".$_POST['prezime']."</p>
        <p>Komentar: ".$_POST['comment']."</p>
    ");

    function sendMail($body, $debug = false) {
        $mail = new PHPMailer(); // create a new object
        $mail->IsSMTP(); // enable SMTP
        $mail->IsHTML(true);
        $mail->SetFrom("poruci@fotostudioart.rs");
        $mail->FromName = "Art Digital";
        $mail->Subject = "Novi komentar, " . date('F d Y H:i');
        $mail->Body = $body;
        $mail->AddAddress("nemanja02marjanov@gmail.com");
        $mail->AddAddress("artdigital29@gmail.com");

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

    // function sendMail($body, $debug = false) {
    //     $mail = new PHPMailer(); // create a new object
    //     $mail->IsSMTP(); // enable SMTP
    //     $mail->SMTPDebug = 0; // debugging: 1 = errors and messag 2 = messages only
    //     $mail->SMTPAuth = true; // authentication enabled
    //     $mail->SMTPSecure = 'ssl'; // secure transfer enabled REQUIRED for Gmail
    //     $mail->Host = "mailcluster.loopia.se";
    //     $mail->Port = 465; // or 587
    //     $mail->IsHTML(true);
    //     $mail->Username = "poruci@fotostudioart.rs";
    //     $mail->Password = "Nemanja2501";
    //     $mail->SetFrom("poruci@fotostudioart.rs");
    //     $mail->Subject = "Novi komentar, " . date('F d Y H:i');
    //     $mail->Body = $body;
    //     $mail->AddAddress("nemanja02marjanov@gmail.com");
        
    //     $mail->AddAddress("artdigital29@gmail.com");

    //     // $mail->preSend();
    //     // echo $mail->getSentMIMEMessage();

    //     if(!$mail->Send()) {
    //         // echo "Mailer Error: " . $mail->ErrorInfo;
    //         echo json_encode(['success'=>0, 'msg' => $mail->ErrorInfo]);
    //         return false;
    //     } else {
    //         echo json_encode(['success'=>1, 'msg' => 'success']);
    //         return true;
    //         // echo "Message has been sent";
    //     }
    // }
?>