<?php 
ini_set('post_max_size', '10G');
ini_set('max_file_uploads', 1000);
ini_set('upload_max_filesize', 0);
ini_set("memory_limit", "-1");
ini_set('max_input_vars', 1000);
ini_set('display_errors',1);
ini_set('display_startup_errors', 1);
require_once 'baza.php';
require 'vendor/autoload.php';
use Medoo\Medoo;
    $images = [];
    if(isset($_FILES['images']) && !isset($_POST['session'])) {
        for($count = 0; $count < count($_FILES['images']['name']); $count++)
        {
            $extension = pathinfo($_FILES['images']['name'][$count], PATHINFO_EXTENSION);
    
            $new_name = bin2hex(random_bytes(32)) . '.';
    
            move_uploaded_file($_FILES['images']['tmp_name'][$count], 'uploads/' . $new_name . $extension);

            $ip = "unknown";
            $error = "";

            try {
                $destination = webpImage('uploads/' . $new_name . $extension,  'uploads/' . $new_name . 'low.webp', 60, false);

                
                if (strpos($destination, 'error') !== false) {
                    $error = $destination;
                }
                
                $ip = getUserIP();
            } catch(Exception $e) {
                $error = $e;
            }

            array_push($images,$new_name . $extension);
        }
    
        echo json_encode($images);
    }
    if(isset($_FILES['images']) && isset($_POST['session']))
    {
        $type = isset($_POST['size']) ? $_POST['size'] : '10x15';
        $cnt = isset($_POST['count']) ? $_POST['count'] : '1';
        $session = $_POST['session'];
        $database = new Medoo([
            'type' => 'mysql',
            'host' => 'localhost',
            'database' => 'slike',
            'username' => 'root',
            'password' => 'Test1234'
        ]);
        for($count = 0; $count < count($_FILES['images']['name']); $count++)
        {


            
            $extension = pathinfo($_FILES['images']['name'][$count], PATHINFO_EXTENSION);
    
            $new_name = bin2hex(random_bytes(32)) . '.';
    
            move_uploaded_file($_FILES['images']['tmp_name'][$count], 'uploads/' . $new_name . $extension);

            $ip = "unknown";
            $error = "";

            try {
                $destination = webpImage('uploads/' . $new_name . $extension,  'uploads/' . $new_name . 'low.webp', 60, false);

                
                if (strpos($destination, 'error') !== false) {
                    $error = $destination;
                }
                
                $ip = getUserIP();
            } catch(Exception $e) {
                $error = $e;
            }

            array_push($images,$new_name . $extension);
            $dbname = $new_name . $extension;
            $database->insert('uploads', [
                'image' => $dbname,
                'session_id' => $session,
                'ip' => $ip,
                'size' => $type,
                'count' => $cnt,
                'error' =>$error
            ]);

            if ($e = $database->error) {
                file_put_contents('/var/www/html/public_html/app/log.txt', $e . '\n', FILE_APPEND) or die('a');
            }

            // $db->query("INSERT INTO uploads (`image`, `session_id`, `ip`, `size`, `count`, `error`) VALUES (`".$dbname."`, `".$session."`, `".$ip."`, `".$type."`, `".$cnt."`, `".$error."`)");
            // if ($e = $db->getError()) {
            //     file_put_contents('/var/www/html/public_html/app/log.txt', $e . '\n', FILE_APPEND) or die('a');
            // }
            if ($error) {
                file_put_contents('/var/www/html/public_html/app/log.txt', $error . '\n', FILE_APPEND) or die('a');
            }
        }
    
        echo json_encode($images);
    }

    function getUserIP()
    {
        if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
                $_SERVER['REMOTE_ADDR'] = $_SERVER["HTTP_CF_CONNECTING_IP"];
                $_SERVER['HTTP_CLIENT_IP'] = $_SERVER["HTTP_CF_CONNECTING_IP"];
        }
        $client  = @$_SERVER['HTTP_CLIENT_IP'];
        $forward = @$_SERVER['HTTP_X_FORWARDED_FOR'];
        $remote  = $_SERVER['REMOTE_ADDR'];

        if(filter_var($client, FILTER_VALIDATE_IP))
        {
            $ip = $client;
        }
        elseif(filter_var($forward, FILTER_VALIDATE_IP))
        {
            $ip = $forward;
        }
        else
        {
            $ip = $remote;
        }

        return $ip;
    }

    function webpImage($source, $destination, $quality = 100, $removeOld = false) {
        $dir = pathinfo($source, PATHINFO_DIRNAME);
        $name = pathinfo($source, PATHINFO_FILENAME);
        $info = getimagesize($source);
        $isAlpha = false;
        try {
            if ($info['mime'] == 'image/jpeg')
                $image = imagecreatefromjpeg($source);
            elseif ($isAlpha = $info['mime'] == 'image/gif') {
                $image = imagecreatefromgif($source);
            } elseif ($isAlpha = $info['mime'] == 'image/png') {
                $image = imagecreatefrompng($source);
            } else {
                return $source;
            }
            if ($isAlpha) {
                imagepalettetotruecolor($image);
                imagealphablending($image, true);
                imagesavealpha($image, true);
            }
            imagewebp($image, $destination, $quality);

            if ($removeOld)
                unlink($source);
        } catch(Exception $e) {
            return "error: $e";
        }

        return $destination;
    }
    
?>