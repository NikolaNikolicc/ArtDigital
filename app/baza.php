<?php

error_reporting(E_ALL);
ini_set('display_errors',1);  

    class DB {
        private $res;
        private $conn;

        public function DB() {
            $this->conn = new mysqli(
                'localhost', 
                'root', 
                'Test1234', 
                'slike'
            );
            $this->conn->set_charset("utf8");
            // echo $this->getConnectError();
        }

        public function query($query) {
            $this->res = $this->conn->query($query);
        }

        public function multi_query($query) {
            $this->res = $this->conn->multi_query($query);
        }

        public function escape($string) {
            return mysqli_real_escape_string($this->conn, $string);
        }

        public function fetch($assoc) {
            if ($assoc)
                return $this->res->fetch_all(MYSQLI_ASSOC);
            else
                return $this->res->fetch_all();
        }
        function getConnectError() {
            return $this->conn->connect_error;
        }
        function getError() {
            return $this->conn->error;
        }
        function getRowsNum() {
            return ($this->res ? $this->res->num_rows : 0);
        }

        function insertedID() {
            return $this->conn->insert_id;
        }

        function close() {
            return $this->conn->close();
        }
    }
?>