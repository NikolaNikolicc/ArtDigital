<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

require 'vendor/autoload.php';

    $dir = '/var/www/html/public_html/app/uploads';
    $files = scandir($dir);
    $found = [];
    $end = strtotime('2022-12-12 12:11:37');
    $start = strtotime('2022-12-12 12:00:00');

    // $end = strtotime('2022-12-12 11:49:54');
    // $start = strtotime('2022-12-12 11:30:54');

    // $end = strtotime('2022-12-12 11:15:33');
    // $start = strtotime('2022-12-12 10:55:33');
    

    $zip = new ZipArchive();
        $zippath = trim("Snezana-Simić-1670856241.zip");
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
            foreach($files as $f) {
                $t = filectime($dir . '/' .$f);
                if ($t <= $end && $t >= $start) {
                    if (strpos($f, 'webp') === false)
                    array_push($found, $f);
                    $zip->addFile($dir . '/' .$f);
                }
            }
        } catch (Exception $e) {
            echo json_encode(['success'=>0, 'msg' => $e]);
            exit();
        }
        $zip->close();

    var_dump(count($found));

    $msg = base64_decode('CiAgICAgICAgPGh0bWw+CiAgICAgICAgICAgIDxoZWFkPjwvaGVhZD4KICAgICAgICAgICAgPGJvZHk+CiAgICAgICAgICAgICAgICA8cD5JbWU6IFNuZXphbmEgPC9wPgogICAgICAgICAgICAgICAgPHA+UHJlemltZTogU2ltacSHIDwvcD4KICAgICAgICAgICAgICAgIDxwPkVtYWlsOiBuZW5hMDMwMS5zc0BnbWFpbC5jb208L3A+CiAgICAgICAgICAgICAgICA8cD5UZWxlZm9uOiAwNjM3NTk1MDAxIDwvcD4KICAgICAgICAgICAgICAgIDxwPlZyc3RhIHNsaWtlOiBTamFqPC9wPgogICAgICAgICAgICAgICAgPHA+Q2VuYTogMjAwMiBSU0Q8L3A+CiAgICAgICAgICAgICAgICA8cD5Ba2NpamE6IEFsYnVtIGkgUG9zdGVyPC9wPgogICAgICAgICAgICAgICAgPHA+QmVsaSByYW06IEJlejwvcD4KICAgICAgICAgICAgICAgIDxocj4KICAgICAgICAgICAgICAgICAgICA8cD5BZHJlc2E6IFBhdmxhIExhYmF0YSAzMCBBIDwvcD4KICAgICAgICAgICAgICAgICAgICA8cD5HcmFkOiBCZW9ncmFkIDwvcD4KICAgICAgICAgICAgICAgICAgICA8cD5Qb3N0YW5za2kgYnJvajogMTEwMDA8L3A+CiAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgPGhyPjxwPkRvZGF0bmEgcG9ydWthOiA8L3A+PGhyPgogICAgICAgICAgICAgICAgICAgIDxwPkxpbms6IDxhIGhyZWY9J2h0dHBzOi8vZm90b3N0dWRpb2FydC5ycy9hcHAvemlwcy9TbmV6YW5hLVNpbWnEhy0xNjcwODU2MjQxLnppcCc+UHJldXptaSB6aXA8L2E+PC9wPgogICAgICAgICAgICAgICAgICAgIDxocj4KICAgICAgICAgICAgPC9ib2R5PgogICAgICAgIDwvaHRtbD4=');

    sendMail($msg, null);

    function sendMail($body, $data, $debug = false) {
        $mail = new PHPMailer(); // create a new object
        $mail->IsSMTP(); // enable SMTP
        $mail->SMTPDebug = 0; // debugging: 1 = errors and messag 2 = messages only
        $mail->SMTPAuth = true; // authentication enabled
        $mail->SMTPSecure = 'ssl'; // secure transfer enabled REQUIRED for Gmail
        $mail->Host = "mailcluster.loopia.se";
        $mail->Port = 465; // or 587
        $mail->IsHTML(true);
        $mail->Username = "poruci@fotostudioart.rs";
        $mail->Password = "Nemanja2501";
        $mail->SetFrom("poruci@fotostudioart.rs");
        $mail->Subject = "Nova porudzbina, " . date('F d Y H:i');
        $mail->Body = $body;
        $mail->AddAddress("nemanja02marjanov@gmail.com");
        
        $mail->AddAddress("artdigital29@gmail.com");

        // $mail->preSend();
        // echo $mail->getSentMIMEMessage();

        if(!$mail->Send()) {
            // echo "Mailer Error: " . $mail->ErrorInfo;
            echo json_encode(['success'=>0, 'msg' => $mail->ErrorInfo]);
            exit();
        } else {
            echo json_encode(['success'=>1, 'msg' => 'success']);
            // echo "Message has been sent";
        }
    }
?>