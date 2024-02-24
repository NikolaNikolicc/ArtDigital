<?php 

    require_once 'baza.php';
    $db = new DB();
    

    $page = 1;
    if (isset($_GET['page'])) {
        $page = $_GET['page'];
    }

    $offset = ($page - 1) * 20;
    $search = "";
    if (isset($_GET['search'])) {
        $search = $_GET['search'];
        $db->query("SELECT * FROM slike WHERE FROM_BASE64(data) LIKE '%$search%' ORDER BY id DESC LIMIT 20 OFFSET $offset");
    } else {
        $db->query("SELECT * FROM slike ORDER BY id DESC LIMIT 20 OFFSET $offset");
    }

    $data = $db->fetch(true);

    function time_elapsed_string($datetime, $full = false, $useago = true, $debug = false) {
		if ($debug) var_dump($datetime);
		$now = new DateTime;
		$ago = new DateTime($datetime);
		$diff = $now->diff($ago);
	
		$diff->w = floor($diff->d / 7);
		$diff->d -= $diff->w * 7;
	
		$string = array(
			'y' => 'g',
			'm' => 'm',
			'w' => 'n',
			'd' => 'd',
			'h' => 'h',
			'i' => 'min',
			's' => 'sec',
		);
		foreach ($string as $k => &$v) {
			if ($diff->$k) {
				$v = $diff->$k . '' . $v;
			} else {
				unset($string[$k]);
			}
		}
	
		if (!$full) $string = array_slice($string, 0, 1);
		return $string ? (($useago) ? 'Pre ' . implode(', ', $string) : '')  : 'Sad';
	}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=0.5">
    <title>Porudzbine</title>
    <link rel="stylesheet" href="sajtcss/downloads.css?id=<?php echo uniqid(true); ?>">
</head>
<body>
    <div class="wrapper">
        <div class="filters">
            <div class="search">
                <input type="text" placeholder="Pretraga" id="search" value="<?php echo $search ?>">
                <div onclick="search()"><i class="fas fa-search"></i></div>
            </div>
        </div>
        <div class="items">
            <?php foreach ($data as $item) {
                $color = "";
                if ($item['downloaded'] == 1) {
                    $color = "downloaded";
                }
                if ($item['done'] == 0) {
                    $color = "proccessing";
                }
                if ($item['error'] == 1) {
                    $color = "error";
                }
                $dostava = json_decode(base64_decode($item['data']));
            ?>
                <div class="item <?php echo $color ?>">
                    <div class="header">
                        <div class="name">Ime i prezime: <?php echo $dostava->contact->ime ?> <?php echo $dostava->contact->prezime ?></div>
                        <div class="preuzimanje">
                            <div class="dostava">
                                <?php if ($dostava->contact->preuzimanje == 'Kurirska sluzba') {?>
                                    <div class="dostava-text"><i class="fas fa-truck-arrow-right"></i> Dostava</div>
                                    <div class="adresa"> <i class="fas fa-location-dot"></i> <?php echo $dostava->contact->adresa ?></div>
                                    <div class="grad"><i class="fas fa-city"></i> <?php echo $dostava->contact->grad ?>, <?php echo $dostava->contact->zip ?></div>
                                    <div class="grad"><i class="fas fa-truck"></i> <?php echo $dostava->contact->kurir ?></div>
                                <?php } else {?>
                                    <div class="dostava-text"><i class="fas fa-shop"></i> Licno preuzimanje</div>
                                    <div class="grad"><i class="fas fa-location-dot"></i> <?php echo $dostava->contact->mesto_preuzimanja ?></div>
                                <?php } ?>
                                <div class="grad"><i class="fas fa-phone"></i> <?php echo $dostava->contact->telefon ?></div>
                                <div class="grad"><i class="fas fa-envelope"></i> <?php echo $dostava->contact->email ?></div>
                                <div><i class="far fa-message"></i> Dodatna poruka: <?php echo $dostava->contact->poruka == "" ? '/' : $dostava->contact->poruka ?></div>
                            </div>
                            <div class="dostava">
                                <div class="dostava-text">Dodatne informacije</div>
                                <div><i class="fas fa-star"></i> Akcija: <?php echo $dostava->akcija ?></div>
                                <div><i class="fas fa-image"></i> Vrsta: <?php echo $dostava->type ?></div>
                                <div><i class="fas fa-crop-simple"></i> Ram: <?php echo $dostava->ram == 0 ? 'Bez rama' : 'Sa ramom' ?></div>
                                <div><i class="fas fa-coins"></i> Cena: <?php echo $dostava->cena ?>din</div>
                            </div>
                        </div>

                        <div class="date"><?php echo time_elapsed_string($item['vreme']) ?></div>
                        <?php if($color == 'proccessing') {?>
                            <div class="preuzmi obrada">Obrada u toku</div>
                        <?php } else { ?>
                            <div class="preuzmi" onclick="download(<?php echo $item['id'] ?>, '<?php echo $item['zip'] ?>', this)"><?php echo $item['downloaded'] == 0 ? 'Preuzmi' : 'Preuzmi ponovo' ?></div>
                        <?php } ?>
                        
                    </div>
                </div>
            <?php }?>
        </div>

        <div class="pagination">
            <a class="button" href="?page=<?php echo $page-1 > 0 ? $page-1 : 1 ?><?php echo $search != "" ? '&search=' . $search : "" ?>"><i class="fas fa-chevron-left"></i></a>
            <div class="button"><?php echo $page ?></div>
            <a class="button" href="?page=<?php echo $page+1 ?><?php echo $search != "" ? '&search=' . $search : "" ?>"><i class="fas fa-chevron-right"></i></a>
        </div>

    </div>  
    <script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/js/all.min.js" integrity="sha512-2bMhOkE/ACz21dJT8zBOMgMecNxx0d37NND803ExktKiKdSzdwn+L7i9fdccw/3V06gM/DBWKbYmQvKMdAA9Nw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script>
        function download(id, zip, elem) {
            $(elem).html('<div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>');
            var res = fetch(`d.php?id=${id}&zip=${zip}`)
            .then(resp => resp.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                // the filename you want
                a.download = zip;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                $(elem).html('Preuzmi ponovo');
                elem.parentNode.parentNode.classList.add('downloaded');
            })
        
        }
        function search() {
            var search = document.getElementById('search').value;
            window.location.href = `?search=${search}&page=1`;
        }
    </script>
</body>
</html>