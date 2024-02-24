<?php
require_once 'baza.php';
error_reporting(E_ALL);
ini_set('display_errors',1);
ini_set('post_max_size', 0);
ini_set('upload_max_filesize', 0);
ini_set("memory_limit", "-1");

    $post = json_decode($_POST['data'], true);


    $db = new DB();
    $session = $post['session'];
    $db->query("INSERT INTO slike (data, slike, zip, session) VALUES('".base64_encode(json_encode($post))."', NULL, NULL, '".$session."')");
?>