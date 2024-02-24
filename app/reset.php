<?php
    var_dump(shell_exec("find /var/www/html/public_html/app/uploads -type f -mtime +1 -delete"));
    var_dump(shell_exec("sudo service mysql start"));
    shell_exec("sudo service mysql restart");
?>