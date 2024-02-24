<?php
    require_once 'baza.php';
    $db = new DB();
    $zip = $_GET['zip'];
    $id = $_GET['id'];

    $db->query("UPDATE slike set downloaded = 1 WHERE id = $id");

    $yourfile = "zips/$zip";

    $file_name = basename($yourfile);

    header("Content-Type: application/zip");
    header("Content-Disposition: attachment; filename=$file_name");
    header("Content-Length: " . filesize($yourfile));

    readfile($yourfile);
    exit;

?>