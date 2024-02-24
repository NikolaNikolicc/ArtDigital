<?php 
    ini_set('post_max_size', '10G');
    ini_set('max_file_uploads', 1000);
    ini_set('upload_max_filesize', 0);
    ini_set("memory_limit", "-1");
    ini_set('max_input_vars', 1000);
    ini_set('display_errors',1);
    ini_set('display_startup_errors', 1);
    require_once 'baza.php';
    if(isset($_POST['session']) && isset($_POST['size'])) {
        $session = $_POST['session'];
        $size = $_POST['size'];
        $db = new DB();
        $db->query("UPDATE uploads SET size='".$size."' WHERE session_id = '".$session."'");
        echo $db->getError();
    }
?>