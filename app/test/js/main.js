var aspect_ratio = "32:9";
var ratioxy = [0,0];
var background = "";
var bgInit = true;
var imgCount = 0;
var paper;
var albumSize;
var ablumOrientation;

var pages = [];
var selectedPage = 0;

var setAspectRatio = function(x,y,size) {
    albumSize = size;
    ratioxy[0] = x;
    ratioxy[1] = y;
    document.getElementById('box').style.transform = 'translate(-350px)';
    // document.getElementById('canvas_korica').style.paddingBottom = getCanvasHeight() + '%';
}
// var setOrientation

var setPaper = function(val) {
    if (val == 2) {
        ablumOrientation = "Uspravno"
        var x = ratioxy[0] * 2;
        var y = ratioxy[1];
        aspect_ratio = x + ':' + y
    } else {
        ablumOrientation = "Vodoravno"
        var x = ratioxy[1] * 2;
        var y = ratioxy[0];
        aspect_ratio = x + ':' + y
    }
    document.getElementById('story').style.transform = "translateY(-100%)";
    addPage(true);
}

var zatvoriPregled = function() {
    document.getElementById('pregled').style.transform = "translateY(-100%)";
}
var otvoriPregled = function() {
    previewImages();
    document.getElementById('pregled').style.transform = "translateY(0%)";
}

var finish = function() {
    document.getElementById('box').style.transform = 'translate(-700px)';
    document.getElementById('story').style.transform = "translateY(0%)";
}

var toPrice = function() {
    document.getElementById('box').style.transform = 'translate(-1050px)';
}
var closeInfo = function() {
    document.getElementById('story').style.transform = "translateY(-100%)";
}

var backToInfo = function() {
    document.getElementById('box').style.transform = 'translate(-700px)';
}

var getCanvasHeight = function () {
    var aspect = aspect_ratio.split(':');
    return parseFloat(aspect[1]) * 100 / parseFloat(aspect[0]);
}

var getPageNum = function (id) {
    for (var i = 0; i < pages.length; i++) {
        if (pages[i].id == id) return i;
    }
    return -1;
}

var getImgNum = function (id) {
    for (var i = 0; i < pages[selectedPage].images.length; i++) {
        if (pages[selectedPage].images[i].id == id) return i;
    }
    return -1;
}

var addPage = function (init) {
    var id = Math.random().toString(16).slice(2);
    var page = {
        'id': 'page_' + id,
        'images': [],
    }
    pages.push(page);

    document.getElementById('pages').innerHTML += `
    <div class="page${(init ? ' selected' : '')}" id="${'page_' + id}">
        <div class="row">
            <div class="left">${(init ? '' : 'Strana ')}<span class="page_num">${(init ? 'Korica' : pages.length-1)}</span></div>
            <div class="right">
                ${(!init ? '<i class="fa fa-chevron-up" onclick="movePageUp(this)" ontouchstart="movePageDown(this)"></i><i class="fa fa-chevron-down" onclick="movePageDown(this)" ontouchstart="movePageDown(this)"></i><i class="far fa-trash" onclick="deletePage(this)" ontouchstart="movePageDown(this)"></i>' : '')}
            </div>
        </div>
        <div class="row">
            <div class="canvas" style="background: ${background}; padding-bottom: ${getCanvasHeight()}%" id="${'canvas_' + id}">
                <div class="bar"></div>
            
            </div>
        </div>
    </div>
    `;
    jQuery('.img_editor').resizable({
        snap: true,
        snapMode: "inner",
        snapTolerance:5,
        handles: { 'e': '.anchor'},
        aspectRatio: true,
        alsoResizeReverse: jQuery(this),
        stop: function(event, ui){     
            var parent = ui.element.parent();
               ui.element.css({
                    width: ui.element.width()/parent.width()*100+"%",
                    height: ui.element.height()/parseFloat(parent.css("padding-bottom"))*100+"%"
               });
        },
        resize: function(event,ui) {
        },
        start: function (event, ui) {
            var dir = event.toElement ? event.toElement : event.originalEvent.target;
        }
    }).draggable({
        snap: '.canvas,.bar,.img_editor',
        snapMode: "inner",
        snapTolerance:5,
        start: function(event) {
            click.x = event.clientX;
            click.y = event.clientY;
            jQuery('.img_editor').each(function() {
                jQuery(this).removeClass('edited');
            })
            jQuery(this).addClass('edited');
        },
        drag: function(event, ui) {
            var zoom = document.getElementById('zoom_slider').value
            var original = ui.originalPosition;
            if (zoom != 1)
            ui.position = {
                left: (event.clientX - click.x + original.left) / zoom,
                top:  (event.clientY - click.y + original.top ) / zoom
            };
    
        },
        stop: function(){
            var l = ( 100 * parseFloat(jQuery(this).css("left")) / parseFloat(jQuery(this).parent().css("width")) )+ "%" ;
            var t = ( 100 * parseFloat(jQuery(this).css("top")) / parseFloat(jQuery(this).parent().css("height")) )+ "%" ;
            jQuery(this).css("left" , l);
            jQuery(this).css("top" , t);
         }
    })
    var p = document.getElementsByClassName('page');
    for (var j = 0; j < p.length; j++) {
        p[j].getElementsByClassName('canvas')[0].addEventListener('click', function (e) {
            var prarent = this.parentNode.parentNode;
            if (selectedPage == getPageNum(prarent.id)) return;
            jQuery('.img_editor').each(function() {
                jQuery(this).removeClass('edited');
            })
            selectedPage = getPageNum(prarent.id);
            var p = document.getElementsByClassName('page');
            for (var i = 0; i < p.length; i++) {
                p[i].classList.remove('selected');
            }
            document.getElementById(prarent.id).classList.add('selected');
        })
        jQuery(p[j].getElementsByClassName('canvas')[0]).droppable({
            drop: function(event, ui) {
                if (jQuery(this).find(ui.draggable).length > 0) return;
                click.x = event.clientX;
                click.y = event.clientY;
                var p = document.getElementsByClassName('page');
                for (var i = 0; i < p.length; i++) {
                    p[i].classList.remove('selected');
                }
                jQuery(this).closest('.page').addClass('selected');
                var top = Math.abs(parseFloat(ui.draggable.css("top")));
                var h = Math.abs(parseFloat(jQuery(this).closest('.page').css("height")))
                var final = (h > top) ? h - top + 50 : top - h - 50;
                jQuery(this).append(ui.draggable.css("top", final + 'px'));
            }
        })
    }
}

var changeMenu = function (page) {
    if (page == 'slike') {
        document.getElementById('menu_items').getElementsByTagName('li')[1].classList.remove('active')
        document.getElementById('menu_items').getElementsByTagName('li')[0].classList.add('active')
        document.getElementById('menu_items').getElementsByTagName('li')[2].classList.remove('active')
        document.getElementById('pozadine').style.display = 'none';
        document.getElementById('slike').style.display = 'block';
        document.getElementById('okviri').style.display = 'none';
        menuOn();

    } else if (page == 'pozadine') {
        document.getElementById('menu_items').getElementsByTagName('li')[0].classList.remove('active')
        document.getElementById('menu_items').getElementsByTagName('li')[2].classList.remove('active')
        document.getElementById('menu_items').getElementsByTagName('li')[1].classList.add('active')
        document.getElementById('pozadine').style.display = 'block';
        document.getElementById('okviri').style.display = 'none';
        document.getElementById('slike').style.display = 'none';
        menuOn();
    } else if (page == 'okviri') {
        document.getElementById('menu_items').getElementsByTagName('li')[0].classList.remove('active')
        document.getElementById('menu_items').getElementsByTagName('li')[1].classList.remove('active')
        document.getElementById('menu_items').getElementsByTagName('li')[2].classList.add('active')
        document.getElementById('pozadine').style.display = 'none';
        document.getElementById('slike').style.display = 'none';
        document.getElementById('okviri').style.display = 'block';
        menuOn();
    }
    
}

var addImageToPage = function (id) {
    var img = document.getElementById(id).style.backgroundImage.slice(5, -2);
    document.getElementById('canvas_' + pages[selectedPage].id.split('_')[1]).innerHTML += `
    <div class="img_editor" ontouchstart="imageEditor(this)" onclick="imageEditor(this)" id="image_${imgCount}" style="z-index: ${(pages[selectedPage].images.length+1)*10}">
        <div class="options">
            <div class="option" onclick="deleteImage(this)"><i class="far fa-trash"></i></div>
            <div class="option" onclick="sendBack(this)"><i class="fas fa-send-backward"></i></div>
            <div class="option" onclick="bringFront(this)"><i class="fas fa-bring-forward"></i></div>
            <div class="option" onclick="borderMenu()"><i class="fas fa-border-outer"></i></div>
        </div>
        <div class="anchor"><i class="fas fa-arrows-alt-v"></i></div>
        <img src="${img}" onclick="selectImage(this)">
    </div>
    `;
    pages[selectedPage].images.push({id: `image_${imgCount++}`});
    jQuery('.img_editor').resizable({
        snap: true,
        snapMode: "inner",
        snapTolerance:5,
        handles: { 'e': '.anchor'},
        aspectRatio: true,
        alsoResizeReverse: jQuery(this),
        stop: function(event, ui){     
            var parent = ui.element.parent();
               ui.element.css({
                    width: ui.element.width()/parent.width()*100+"%",
                    height: ui.element.height()/parseFloat(parent.css("padding-bottom"))*100+"%"
               });
        },
        resize: function(event,ui) {
        },
        start: function (event, ui) {
            var dir = event.toElement ? event.toElement : event.originalEvent.target;
        }
    }).draggable({
        snap: '.canvas,.bar,.img_editor',
        snapMode: "inner",
        snapTolerance:5,
        start: function(event) {
            click.x = event.clientX;
            click.y = event.clientY;
            jQuery('.img_editor').each(function() {
                jQuery(this).removeClass('edited');
            })
            jQuery(this).addClass('edited');
        },
        drag: function(event, ui) {
            var zoom = document.getElementById('zoom_slider').value
            var original = ui.originalPosition;
            if (zoom != 1)
            ui.position = {
                left: (event.clientX - click.x + original.left) / zoom,
                top:  (event.clientY - click.y + original.top ) / zoom
            };
    
        },
        stop: function(){
            var l = ( 100 * parseFloat(jQuery(this).css("left")) / parseFloat(jQuery(this).parent().css("width")) )+ "%" ;
            var t = ( 100 * parseFloat(jQuery(this).css("top")) / parseFloat(jQuery(this).parent().css("height")) )+ "%" ;
            jQuery(this).css("left" , l);
            jQuery(this).css("top" , t);
         }
    })
    toggleMenu();
}

var selectImage = function(elem) {

}

var setBackground = function(elem) {
    if (bgInit) {
        var p = document.getElementsByClassName('page');
        background = elem.style.background;
        for (var j = 0; j < p.length; j++) {
            p[j].getElementsByClassName('canvas')[0].style.background = background;
        }
        bgInit = false;
    } else {
        background = elem.style.background;
        document.getElementsByClassName('page')[selectedPage].getElementsByClassName('canvas')[0].style.background = elem.style.background;
    }
}

var borderColor = null;

var setBorder = function(elem) {
    if (elem != null) borderColor = elem.style.background;
    document.getElementsByClassName('edited')[0].getElementsByTagName('img')[0].style.borderStyle = "solid";
    document.getElementsByClassName('edited')[0].getElementsByTagName('img')[0].style.borderColor = borderColor;
    document.getElementsByClassName('edited')[0].getElementsByTagName('img')[0].style.borderWidth = jQuery('#borderWidth').val() + 'px';
}

// addPage(false);
var reposition = '';
var click = {
    x: 0,
    y: 0
};

var makeImages = async function() {
    jQuery('.img_editor').each(function() {
        jQuery(this).removeClass('edited');
    })
    var p = document.getElementsByClassName('page');
    for (var i = 0; i < p.length; i++) {
        p[i].classList.remove('selected');
    }
    jQuery('.bar').each(function() {
        jQuery(this).css('display', 'none');
    })
    var counter = 0;
    for (var i = 0; i < pages.length; i++) {
        var element = document.querySelector('#canvas_' + pages[i].id.split('_')[1]);
        await html2canvas(element, {allowTaint: true, useCORS: true, scale: 3,backgroundColor: null, height: element.offsetHeight - 2, width: element.offsetWidth - 2}).then(canvas => {
            document.body.appendChild(canvas)
            var dataURL = canvas.toDataURL();
            canvas.remove();
            var blob = dataURItoBlob(dataURL);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            url = window.URL.createObjectURL(blob);
            a.href = url;
            var name = (counter == 0) ? 'korica.jpg' : 'strana ' + counter;
            counter++;
            a.download = name;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }
    jQuery('.bar').each(function() {
        jQuery(this).css('display', 'block');
    })
}

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);

    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], {type: mimeString});


}

var previewImages = async function() {
    jQuery('#loaded').css('display', 'none');
    jQuery('#loader').css('display', 'block');
    jQuery('.img_editor').each(function() {
        jQuery(this).removeClass('edited');
    })
    var p = document.getElementsByClassName('page');
    for (var i = 0; i < p.length; i++) {
        p[i].classList.remove('selected');
    }
    jQuery('.bar').each(function() {
        jQuery(this).css('display', 'none');
    })
    var counter = 0;
    jQuery('#preview_items').html('');
    for (var i = 0; i < pages.length; i++) {
        var element = document.querySelector('#canvas_' + pages[i].id.split('_')[1]);
        await html2canvas(element, {allowTaint: true, useCORS: true, scale: 3,backgroundColor: null, height: element.offsetHeight - 2, width: element.offsetWidth - 2}).then(canvas => {
            document.body.appendChild(canvas)
            var dataURL = canvas.toDataURL();
            canvas.remove();
            var blob = dataURItoBlob(dataURL);
            url = window.URL.createObjectURL(blob);
            jQuery('#preview_items').append(`<div class="item"><img src="${url}"></div>`);
        });
    }
    jQuery('#loaded').css('display', 'flex');
    jQuery('#loader').css('display', 'none');
    jQuery('.bar').each(function() {
        jQuery(this).css('display', 'block');
    })
}

var makeFormData = async function() {
    var fd = new FormData();
    jQuery('#waiting').css('display', 'block');
    jQuery('#success').css('display', 'none');
    jQuery('.img_editor').each(function() {
        jQuery(this).removeClass('edited');
    })
    var p = document.getElementsByClassName('page');
    for (var i = 0; i < p.length; i++) {
        p[i].classList.remove('selected');
    }
    jQuery('.bar').each(function() {
        jQuery(this).css('display', 'none');
    })
    var counter = 0;
    for (var i = 0; i < pages.length; i++) {
        var element = document.querySelector('#canvas_' + pages[i].id.split('_')[1]);
        await html2canvas(element, {allowTaint: true, useCORS: true, scale: 3,backgroundColor: null, height: element.offsetHeight - 2, width: element.offsetWidth - 2}).then(canvas => {
            document.body.appendChild(canvas)
            var dataURL = canvas.toDataURL();
            canvas.remove();
            var blob = dataURItoBlob(dataURL);
            url = window.URL.createObjectURL(blob);
            var name = (counter == 0) ? 'korica.jpg' : 'strana ' + counter + '.jpg';
            fd.append('file' + counter, blob, name);
            counter++;
        });
    }
    jQuery('.bar').each(function() {
        jQuery(this).css('display', 'block');
    })
    return fd;
}

var imageEditor = function(elem) {
    jQuery('.img_editor').each(function() {
        jQuery(this).removeClass('edited');
    })
    jQuery(elem).addClass('edited');
}

var borderMenu = function() {
    menuOn();
    changeMenu('okviri')
}

var rotateImage = function(elem) {

    var img = elem.parentNode.parentNode.getElementsByTagName('img')[0];
    img.style.transform = `rotate(${img.style.transform.slice(7, -4) - 90}deg)`
    var h = img.height;
    var w = img.width;
    elem.parentNode.parentNode.style.width = h + 'px';
    elem.parentNode.parentNode.style.height = w + 'px';
}

var deleteImage = function(elem) {
    var img = elem.parentNode.parentNode.remove();
}

var sendBack = function(elem) {
    var index = getImgNum(elem.parentNode.parentNode.id);
    if (index > 0) {
        pages[selectedPage].images.unshift(pages[selectedPage].images.splice(index, 1)[0]);
        for (var i = 0; i < pages[selectedPage].images.length; i++) {
            try {
                document.getElementById(pages[selectedPage].images[i].id).style.zIndex = (i+1)*10;
            } catch(e) {}
        }
    }
}

var bringFront = function(elem) {
    var index = getImgNum(elem.parentNode.parentNode.id);
    pages[selectedPage].images.push(pages[selectedPage].images.splice(index, 1)[0]);
    for (var i = 0; i < pages[selectedPage].images.length; i++) {
        try {
            document.getElementById(pages[selectedPage].images[i].id).style.zIndex = (i+1)*10;
        } catch(e) {}
    }
}

var submit = async function() {
    var error = false;
    if (jQuery('#ime').val().trim() == '') {
        error = true;
        jQuery('#ime').addClass('invalid');
    }
    if (jQuery('#prezime').val().trim() == '') {
        error = true;
        jQuery('#prezime').addClass('invalid');
    }
    if (jQuery('#email').val().trim() == '') {
        error = true;
        jQuery('#email').addClass('invalid');
    }
    if (jQuery('#telefon').val().trim() == '') {
        error = true;
        jQuery('#telefon').addClass('invalid');
    }

    if (jQuery('#shipping2').is(':checked')) {
        if (jQuery('#grad').val().trim() == '') {
            error = true;
            jQuery('#grad').addClass('invalid');
        }
        if (jQuery('#zip').val().trim() == '') {
            error = true;
            jQuery('#zip').addClass('invalid');
        }
        if (jQuery('#adresa').val().trim() == '') {
            error = true;
            jQuery('#adresa').addClass('invalid');
        }
    }
    if (error) {
        document.getElementById('box').style.transform = 'translate(-700px)';
        return;
    };
    document.getElementById('wait').style.transform = 'translateY(0)';
    var fd = await makeFormData();
    var data = {
        'contact': {
            'velicina': albumSize,
            'orientation': ablumOrientation,
            'ime': jQuery('#ime').val(),
            'prezime': jQuery('#prezime').val(),
            'email': jQuery('#email').val(),
            'telefon': jQuery('#telefon').val(),
            'zip': jQuery('#shipping2').is(':checked') ? jQuery('#zip').val() : '',
            'grad': jQuery('#shipping2').is(':checked') ? jQuery('#grad').val() : '',
            'adresa': jQuery('#shipping2').is(':checked') ? jQuery('#adresa').val() : '',
            'preuzimanje': jQuery('#shipping1').is(':checked') ? 'Licno' : 'Kurirska sluzba',
            'mesto_preuzimanja': jQuery('#shipping1').is(':checked') ? (jQuery('#loc1').is(':checked') ? 'Terazije 5' : 'Bulevar Despota Stefana 48') : '',
            'poruka': jQuery('#poruka').val(),
        }
    };
    fd.append('data', JSON.stringify(data));

    jQuery.post({
        'url': 'https://fotostudioart.rs/app/post_album.php',
        'data': fd,
        processData: false,
        contentType: false,
        success: function(res) {
            jQuery('#waiting').css('display', 'none');
            jQuery('#success').css('display', 'block');
        }
    })
}
