var savedFiles;
var queueEvent = new Event('QueueChangeEvent');
var countEvent = new Event('UpdateCountEvent');
var loadedImages = {};
var defaultSize = '10x15';
var sessionID = generateUUID();

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}


document.addEventListener('UpdateCountEvent', function() {
    document.getElementById('loadedImages').innerHTML = getLoadedCount();
    document.getElementById('waitingImages').innerHTML = Object.keys(loadedImages).length;
    document.getElementById('queueCount').innerHTML = queue.queue.length;
})

function canSend() {
    return !queue.hasNext();
}

function getLoadedCount() {
    var c = 0;
    if (loadedImages == {}) return 0;
    for (const img in loadedImages) {
        if (loadedImages[img].loaded) c++;
    }
    return c;
}

function NetworkImage(id) {
    var me = this;
    
    me.id = id;
    me.url = null;
    me.loaded = false;
    me.retried = false
    document.dispatchEvent(countEvent);

    me.upload = function(item, retry) {
        return new Promise((resolve, reject) => {
            console.log('uploading', item);
            me.retried = retry;
            var slot = -1;
            var isSlot = item.type.startsWith('slot_');
            // if starts with slot_
            if (isSlot) {
                slot = parseInt(item.type.split('_')[1]);
                item.type = slots_data[(slot-1) % slots_data.length]['name'];
            }
            var form_data = new FormData();
            form_data.append("images[]", item.file);
            form_data.append("session", sessionID);
            form_data.append("size", (item.type == 'none') ? '10x15' : item.type);
            form_data.append("count", "1");
            var ajax_request = new XMLHttpRequest();

            ajax_request.open("POST", "https://fotostudioart.rs/app/upload2.php");

            if (isSlot) {
                addSlot(me.id, slot);
            } else {
                addImage(me.id, item.type);
            }
            ajax_request.upload.addEventListener('progress', function(event){
                var percent_completed = Math.round((event.loaded / event.total) * 100);
                if (isSlot) {
                    document.getElementById(`slot_${slot}`).getElementsByClassName('progress_text')[0].innerHTML = percent_completed;
                } else {
                    document.getElementById(me.id).getElementsByClassName('bar')[0].style.width = percent_completed + '%';
                    document.getElementById(me.id).getElementsByClassName('progress_text')[0].innerHTML = percent_completed + '%';
                }
            });

            ajax_request.addEventListener('error', function(error){
                if (isSlot) {
                    showPopup("Doslo je do greske prilikom slanja slike za poklon. Molimo pokusajte ponovo.");
                    deleteSlotAsync(document.getElementById(`slot_${slot}`));
                } else {
                    document.getElementById(me.id).getElementsByClassName('progress_text')[0].innerHTML = "Greska"
                }
                reject(false)
            })

            ajax_request.addEventListener('load', function(event){
                if (isSlot) {
                    document.getElementById('slotUpload').value = '';
                    var images = [];
                    try {
                        images = JSON.parse(event.target.response);
                    } catch (e) {
                        images = ['fail'];
                    }
    
                    me.url = images[0];
                    me.loaded = true;
                    document.dispatchEvent(countEvent);
                    editSlot(me.id, images[0], me.url.split('/').pop(), slot);
                    
                    return resolve(true);
                } else {
                    document.getElementById('imgUpload').value = '';
                    document.getElementById('uploader').style.display = 'none';
                    var images = [];
                    try {
                        images = JSON.parse(event.target.response);
                    } catch (e) {
                        images = ['fail'];
                    }
    
                    me.url = images[0];
                    me.loaded = true;
                    document.dispatchEvent(countEvent);
                    
                    editImage(me.id, images[0], me.url.split('/').pop());
                    if (Math.floor(getImageCount() / 100) > action_count) {
                        document.getElementById('add_action').style.display = 'block';
                    } else {
                        document.getElementById('add_action').style.display = 'none';
                    }
                    return resolve(true);
                }


            });
            ajax_request.send(form_data);
        })
    }
}

function Queue() {
    var me = this;

    me.queue = [];
    me.proccessing = false;

    me.next = function() {
        return me.queue.pop();
    }

    me.push = function(file, type) {
        me.queue.push({file: file, type: type});
    }

    me.hasNext = function() {
        return me.queue.length > 0;
    }

    me.proccess = async function() {
        if (me.proccessing) return;
        me.proccessing = true;
        
        while (me.hasNext()) {
            console.log('proccessing');
            const test = await upload(me.next());
        }
        me.proccessing = false;
    }
}

var queue = new Queue();

function upload(item) {
    return new Promise((resolve, reject) => {
        var id = Math.random().toString(16).slice(2);
        loadedImages[id] = new NetworkImage(id);
        console.log('uploading', item);
        try {
            loadedImages[id].upload(item, false).then((res) => {
                if (!res) {
                    loadedImages[id].upload(item, true).then(() => {
                        delete loadedImages[id];
                        resolve(true);
                    }, function(error) {resolve()})
                    .catch((e) => {
                        resolve(true);
                    });
                }
                resolve(true);
            }, function(error) {resolve()});
        } catch(e) {
            resolve(true);
        }
    });
}

function countup() {
    uploaded++;
}

async function uploadTest(len, type) {
    for (var i = 0; i < len; i++) {
        const test = await upload(i, poster, album)
    }
}

document.addEventListener('QueueChangeEvent', function() {
    queue.proccess();
})

document.getElementById('imgUpload').onchange = function(event) {
    savedFiles = jQuery.extend(true,{},document.getElementById('imgUpload').files);
    for (var i = 0; i < savedFiles.length; i++) {
        queue.push(savedFiles[i], 'none');
    }
    document.dispatchEvent(queueEvent);
}

// document.getElementById('nista_akcija').onchange = function() {
//     document.getElementById('float').style.display = 'none';
// }

// document.getElementById('album_akcija').onchange = function() {
//     document.getElementById('float').style.display = 'none';
    
//     // document.getElementById('poster_akcija').setAttribute('disabled', true);
//     // document.getElementById('nista_akcija').setAttribute('disabled', true);
//     // document.getElementById('sve_akcija').setAttribute('disabled', true);
//     document.getElementById('nista_akcija').removeAttribute('checked')
// }

// document.getElementById('poster_akcija').onchange = function() {
//     document.getElementById('float').style.display = 'flex';
//     document.getElementById('nista_akcija').removeAttribute('checked')
// }
try {
    document.getElementById('posterUpload').onchange = function(event) {
        if (document.getElementById('album_akcija')) document.getElementById('album_akcija').setAttribute('disabled', true);
        if (document.getElementById('sve_akcija')) document.getElementById('sve_akcija').setAttribute('disabled', false);
        if (document.getElementById('privezak_album_akcija')) document.getElementById('privezak_album_akcija').setAttribute('disabled', true);
        if (document.getElementById('magnet_album_akcija')) document.getElementById('magnet_album_akcija').setAttribute('disabled', true);
        savedFiles = jQuery.extend(true,{},document.getElementById('posterUpload').files);
        for (var i = 0; i < savedFiles.length; i++) {
            queue.push(savedFiles[i],'a3');
        }
        document.dispatchEvent(queueEvent);
        showSuccess('Uspesno ste dodali poster');
    }
} catch(e) {
    console.log(e);
}

try {
    document.getElementById('novcanikUpload').onchange = function(event) {
        if (document.getElementById('album_akcija')) document.getElementById('album_akcija').setAttribute('disabled', true);
        if (document.getElementById('sve_akcija')) document.getElementById('sve_akcija').setAttribute('disabled', false);
        if (document.getElementById('privezak_album_akcija')) document.getElementById('privezak_album_akcija').setAttribute('disabled', true);
        if (document.getElementById('magnet_album_akcija')) document.getElementById('magnet_album_akcija').setAttribute('disabled', true);
        savedFiles = jQuery.extend(true,{},document.getElementById('novcanikUpload').files);
        for (var i = 0; i < savedFiles.length; i++) {
            queue.push(savedFiles[i],'novcanik');
        }
        document.dispatchEvent(queueEvent);
        showSuccess('Uspesno ste dodali fotografiju za novcanik');
    }
} catch(e) {
    console.log(e);
}

try {
    document.getElementById('specialUpload').onchange = function(event) {
        if (document.getElementById('album_akcija')) document.getElementById('album_akcija').setAttribute('disabled', true);
        if (document.getElementById('sve_akcija')) document.getElementById('sve_akcija').setAttribute('disabled', false);
        if (document.getElementById('privezak_album_akcija')) document.getElementById('privezak_album_akcija').setAttribute('disabled', true);
        if (document.getElementById('magnet_album_akcija')) document.getElementById('magnet_album_akcija').setAttribute('disabled', true);
        savedFiles = jQuery.extend(true,{},document.getElementById('specialUpload').files);
        for (var i = 0; i < savedFiles.length; i++) {
            queue.push(savedFiles[i],'iznenadjenje');
        }
        document.dispatchEvent(queueEvent);
        showSuccess('Uspesno ste dodali fotografiju za iznenadjenje');
    }
} catch(e) {
    console.log(e);
}

try {
    document.getElementById('sve_akcija').onchange = function() {
        document.getElementById('float').style.display = 'flex';
        document.getElementById('posterUp').style.display ="block";
        document.getElementById('privezakUp').style.display ="none";
        document.getElementById('magnetUp').style.display ="none";
        document.getElementById('nista_akcija').removeAttribute('checked')
    }
    
} catch(e) {
    console.log(e);
}
try {
    document.getElementById('all_akcija').onchange = function() {
        document.getElementById('float').style.display = 'flex';
        document.getElementById('posterUp').style.display ="block";
        document.getElementById('privezakUp').style.display ="block";
        document.getElementById('magnetUp').style.display ="block";
        document.getElementById('nista_akcija').removeAttribute('checked')
    }
} catch(e) {
    console.log(e);
}
try {
    document.getElementById('privezak_album_akcija').onchange = function() {
        document.getElementById('float').style.display = 'flex';
        document.getElementById('posterUp').style.display ="none";
        document.getElementById('privezakUp').style.display ="block";
        document.getElementById('magnetUp').style.display ="none";
        document.getElementById('nista_akcija').removeAttribute('checked')
    }
} catch(e) {
    console.log(e);
}
try {

    document.getElementById('privezakUpload').onchange = function(event) {
        if (document.getElementById('album_akcija')) document.getElementById('album_akcija').setAttribute('disabled', true);
        if (document.getElementById('sve_akcija')) document.getElementById('sve_akcija').setAttribute('disabled', true);
        if (document.getElementById('privezak_album_akcija')) document.getElementById('privezak_album_akcija').setAttribute('disabled', false);
        if (document.getElementById('magnet_album_akcija')) document.getElementById('magnet_album_akcija').setAttribute('disabled', true);
        savedFiles = jQuery.extend(true,{},document.getElementById('privezakUpload').files);
        if (savedFiles.length != 2) {
            showPopup("Morate izabrati 2 slike za privezak");
            return;
        }
        for (var i = 0; i < savedFiles.length; i++) {
            queue.push(savedFiles[i],'privezak');
        }
        document.dispatchEvent(queueEvent);
        showSuccess('Uspesno ste dodali privezak');
    }
    
} catch(e) {
    console.log(e);
}

try {
    document.getElementById('magnet_album_akcija').onchange = function() {
        document.getElementById('float').style.display = 'flex';
        document.getElementById('posterUp').style.display ="none";
        document.getElementById('privezakUp').style.display ="none";
        document.getElementById('magnetUp').style.display ="block";
        document.getElementById('nista_akcija').removeAttribute('checked')
    }
} catch(e) {
    console.log(e);
}

try {
    document.getElementById('magnetUpload').onchange = function(event) {
        if (document.getElementById('album_akcija')) document.getElementById('album_akcija').setAttribute('disabled', true);
        if (document.getElementById('sve_akcija')) document.getElementById('sve_akcija').setAttribute('disabled', true);
        if (document.getElementById('privezak_album_akcija')) document.getElementById('privezak_album_akcija').setAttribute('disabled', true);
        if (document.getElementById('magnet_album_akcija')) document.getElementById('magnet_album_akcija').setAttribute('disabled', false);
        savedFiles = jQuery.extend(true,{},document.getElementById('magnetUpload').files);
        for (var i = 0; i < savedFiles.length; i++) {
            queue.push(savedFiles[i],'magnet');
        }
        document.dispatchEvent(queueEvent);
        showSuccess('Uspesno ste dodali magnet');
    }
    
} catch(e) {
    console.log(e);
}

var slot_id = 0;

try {
    document.getElementById('slotUpload').onchange = function(event) {
        savedFiles = jQuery.extend(true,{},document.getElementById('slotUpload').files);
        for (var i = 0; i < savedFiles.length; i++) {
            console.log('slot_' + slot_id);
            queue.push(savedFiles[i], 'slot_' + slot_id);
        }
        document.dispatchEvent(queueEvent);
        // showSuccess('Uspesno ste dodali magnet');
    }
    
} catch(e) {
    console.log(e);
}

jQuery("#ne_akcija").change(function(){
    if (jQuery("#ne_akcija").is(":checked")) {
        document.getElementById('show_akcija').style.display = 'none';
    }
});

jQuery("#da_akcija").change(function(){
    if (jQuery("#da_akcija").is(":checked")) {
        document.getElementById('show_akcija').style.display = 'block';
    }
});

jQuery('#shipping1').change(function(){
        jQuery('#licno').show();
        jQuery('#shipping').hide();
})
jQuery('#shipping2').change(function(){
    jQuery('#licno').hide();
    jQuery('#shipping').show();
})

jQuery('#slide2 input').change(function(){
    jQuery(this).removeClass('invalid');
})

function editImage(id, data, url) {
    var file = data.split('.').slice(0, -1).join('.');
    document.getElementById(id).getElementsByTagName('img')[0].setAttribute('data-src', url);
    document.getElementById(id).getElementsByTagName('img')[0].src = `https://fotostudioart.rs/app/uploads/${file}.low.webp`;
    document.getElementById(id).getElementsByClassName('overlay')[0].style.display = 'none';
}

function editSlot(id, data, url, slot_id_) {
    var file = data.split('.').slice(0, -1).join('.');


    var slot = document.getElementById('slot_' + slot_id_);
    slot.getElementsByTagName('img')[0].setAttribute('data-src', url);
    slot.getElementsByTagName('img')[0].src = `https://fotostudioart.rs/app/uploads/${file}.low.webp`;
    slot.getElementsByClassName('progress')[0].style.display = 'none';

    //buttons
    slot.getElementsByClassName('add')[0].style.display = 'none';
    slot.getElementsByClassName('delete')[0].style.display = 'block';
}

async function deleteSlotAsync(elem) {
    return new Promise((resolve, reject) => {
        var slot = elem;

        var data_src = slot.getElementsByTagName('img')[0].getAttribute('data-src'); 
        console.log('data_src', data_src);

        if (data_src == null) {
            //buttons
            slot.getElementsByClassName('add')[0].style.display = 'block';
            slot.getElementsByClassName('delete')[0].style.display = 'none';
            slot.getElementsByClassName('progress')[0].style.display = 'none';
        }

        slot.getElementsByTagName('img')[0].removeAttribute('src');
        slot.getElementsByTagName('img')[0].removeAttribute('data-src');

        //buttons
        slot.getElementsByClassName('add')[0].style.display = 'block';
        slot.getElementsByClassName('delete')[0].style.display = 'none';

        var id = slot.getAttribute('image_id');
        delete loadedImages[id];

        var form_data = new FormData();
        form_data.append("image", data_src);
        form_data.append("session", sessionID);

        if (data_src == null) return resolve(true);

        var ajax_request = new XMLHttpRequest();

        ajax_request.open("POST", "https://fotostudioart.rs/app/delete.php");
        ajax_request.onload = function() {
            return resolve(true);
        }
        ajax_request.onerror = function() {
            return resolve(false);
        }

        ajax_request.send(form_data);
        document.dispatchEvent(countEvent);
    });
}

async function deleteSlot(elem) {
    return new Promise((resolve, reject) => {
        var slot = elem.parentNode.parentNode;

        var data_src = slot.getElementsByTagName('img')[0].getAttribute('data-src'); 

        slot.getElementsByTagName('img')[0].removeAttribute('src');
        slot.getElementsByTagName('img')[0].removeAttribute('data-src');

        //buttons
        slot.getElementsByClassName('add')[0].style.display = 'block';
        slot.getElementsByClassName('delete')[0].style.display = 'none';

        var id = slot.getAttribute('image_id');
        delete loadedImages[id];

        var form_data = new FormData();
        form_data.append("image", data_src);
        form_data.append("session", sessionID);
        var ajax_request = new XMLHttpRequest();

        ajax_request.open("POST", "https://fotostudioart.rs/app/delete.php");
        ajax_request.onload = function() {
            return resolve(true);
        }
        ajax_request.onerror = function() {
            return resolve(false);
        }

        ajax_request.send(form_data);
        document.dispatchEvent(countEvent);
    });
}

function findPrice() {
    var text = "";
    var count = 0;
    var cena = 0;
    var formati = {
        'A3 Akcija': 0,
        'Privezak': 0,
        'Magnet': 0,
        '10x15': 0,
        'polaroid': 0,
        '9x13': 0,
        '13x18': 0,
        '15x21': 0,
        '20x25': 0,
        '15x30': 0,
        '20x30': 0,
        '30x40': 0,
        '25x38': 0,
        '30x40': 0,
        '40x50': 0,
        '50x70': 0,
    };
    
    var popust = false;
    jQuery('#images .item').each(function(index){
        var size = jQuery(this).find('.browser-default').val();
        formati[size] += parseInt(jQuery(this).find('.am').val());
        count += parseInt(jQuery(this).find('.am').val());
        
    });
    var akcija = '';
    if (document.getElementById('da_akcija').checked) {
        var slots = document.getElementById('slots').getElementsByClassName('slot');
        
        for (var i = 0; i < slots.length; i++) {
            console.log(slots_data[i])
            var type = slots_data[i]['name'];
            console.log(type);
            akcija += `<div class="item" style="text-align:center">
            <img src="${slots[i].getElementsByTagName('img')[0].getAttribute('src')}" alt="" height="70" style="margin-right:10px">
            <p>${type}</p>
        </div>`
        }
    }
    if (akcija != '') {
        document.getElementById('slike_akcija').style.display = 'flex';
        document.getElementById('slike_akcija').innerHTML = akcija;
    } else {
        document.getElementById('slike_akcija').style.display = 'none';
    }
    // if (formati['10x15'] >= 100 || formati['13x18'] >= 100 || formati['9x13'] >= 100) popust = true;
    if (formati['10x15'] > 0) {

        var piecePrice = getPiecePrice('10x15',formati['10x15']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>10x15</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['10x15']) +"</b></p>";
        cena += piecePrice*parseInt(formati['10x15']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['13x18'] > 0) {
        var piecePrice = getPiecePrice('13x18',formati['13x18']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>13x18</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['13x18']) +"</b></p>";
        cena += piecePrice*parseInt(formati['13x18']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['9x13'] > 0) {
        var piecePrice = getPiecePrice('9x13',formati['9x13']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>9x13</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['9x13']) +"</b></p>";
        cena += piecePrice*parseInt(formati['9x13']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['15x21'] > 0) {
        var piecePrice = getPiecePrice('15x21',formati['15x21']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>15x21</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['15x21']) +"</b></p>";
        cena += piecePrice*parseInt(formati['15x21']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['20x30'] > 0) {
        var piecePrice = getPiecePrice('20x30',formati['20x30']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>20x30</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['20x30']) +"</b></p>";
        cena += piecePrice*parseInt(formati['20x30']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['20x25'] > 0) {
        var piecePrice = getPiecePrice('20x25',formati['20x25']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>20x25</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['20x25']) +"</b></p>";
        cena += piecePrice*parseInt(formati['20x25']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['25x38'] > 0) {
        var piecePrice = getPiecePrice('25x38',formati['25x38']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>25x38</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['25x38']) +"</b></p>";
        cena += piecePrice*parseInt(formati['25x38']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['30x40'] > 0) {
        var piecePrice = getPiecePrice('30x40',formati['30x40']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>30x40</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['30x40']) +"</b></p>";
        cena += piecePrice*parseInt(formati['30x40']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['40x50'] > 0) {
        var piecePrice = getPiecePrice('40x50',formati['40x50']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>40x50</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['40x50']) +"</b></p>";
        cena += piecePrice*parseInt(formati['40x50']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['40x60'] > 0) {
        var piecePrice = getPiecePrice('40x60',formati['40x60']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>40x60</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['40x60']) +"</b></p>";
        cena += piecePrice*parseInt(formati['40x60']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['50x70'] > 0) {
        var piecePrice = getPiecePrice('50x70',formati['50x70']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>50x70</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['50x70']) +"</b></p>";
        cena += piecePrice*parseInt(formati['50x70']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    if (formati['polaroid'] > 0) {
        var piecePrice = getPiecePrice('polaroid',formati['polaroid']);
        text += "<p><span class='dimenzija'>Dimenzije fotografije</span>: <b>polaroid</b></p>";
        text += "<p><span class='kolicina'>Kolicina</span>: <b>"+ parseInt(formati['polaroid']) +"</b></p>";
        cena += piecePrice*parseInt(formati['polaroid']);
        text += `<p><span class='cena'>Cena po komadu</span>: <b>${piecePrice}</b></p><br>`;
    }

    // cena += formati['15x30'] * 1;
    // cena += formati['20x38'] * 1;
    // cena += formati['40x50'] * 1;
    jQuery('#racun').html(text);
    jQuery('#cena').text((Math.round(cena * 100) / 100).toString());

    try {
        document.getElementById('kontakt_ime').innerText = document.getElementById('ime').value + ' ' + document.getElementById('prezime').value;
        document.getElementById('kontakt_email').innerText = document.getElementById('email').value;
        document.getElementById('kontakt_tel').innerText = document.getElementById('telefon').value;

        if (jQuery('#shipping1').is(':checked')) {
            document.getElementById('kontakt_licno').style.display = 'block';
            document.getElementById('kontakt_dostava').style.display = 'none';

            if (jQuery('#loc1').is(':checked')) {
                document.getElementById('kontakt_licno_2').style.display = 'block';
                document.getElementById('kontakt_licno_1').style.display = 'none';
            } else {
                document.getElementById('kontakt_licno_1').style.display = 'block';
                document.getElementById('kontakt_licno_2').style.display = 'none';
            }
        } else {
            document.getElementById('kontakt_licno').style.display = 'none';
            document.getElementById('kontakt_dostava').style.display = 'block';
            document.getElementById('kontakt_adresa').innerText = document.getElementById('adresa').value;
            document.getElementById('kontakt_grad').innerText = document.getElementById('grad').value;
            document.getElementById('kontakt_zip').innerText = document.getElementById('zip').value;
            document.getElementById('kontakt_kurir').innerText = jQuery('#kurir1').is(':checked') ? 'D Express' : 'Post Express';
        }

    } catch(e) {}

    return parseInt(cena);
}

function addSlot(id, slot_id) {
    console.log('addSlot', id, slot_id);
    var slot = document.getElementById('slot_' + slot_id);
    slot.setAttribute('image_id', id);
    slot.getElementsByClassName('progress')[0].style.display = 'flex';
    slot.getElementsByTagName('img')[0].src = '/app/loading2.gif';
}

function addImage(id, type) {
    /*
    <div id="delete">
        <div class="btn-floating" onclick="deleteItem(this)"><i class="fas fa-times"></i></div>
    </div>
    */
    document.getElementById('images').insertAdjacentHTML('afterbegin', `
    <div class="item" id = "${id}">
    <div id="delete">
        <div class="btn-floating" onclick="deleteItem(this)"><i class="fas fa-times"></i></div>
    </div>
        <div class="overlay">
            <div class="progress">
                <div id="bar" class="bar"></div>
            </div>
            <div class="progress_text">0%</div>
        </div>
        <div class="img">
            <img src="/app/loading2.gif" >
        </div>
        <div class="controls">
            <div class="input-field lol1" id="${id}_dimension" oninput="change(this)">
                <select class="browser-default">
                    <option value="A3 Akcija" ${(type == 'a3') ? 'selected': ''}>A3 Akcija</option>
                    <option value="Novcanik" ${(type == 'novcanik') ? 'selected': ''}>Novcanik</option>
                    <option value="Iznenadjenje" ${(type == 'iznenadjenje') ? 'selected': ''}>Iznenadjenje</option>
                    <option value="Privezak" ${(type == 'privezak') ? 'selected': ''}>Privezak</option>
                    <option value="Magnet" ${(type == 'magnet') ? 'selected': ''}>Magnet</option>
                    <option value="10x15" ${(type == 'none') ? 'selected': ''}>10x15</option>
                    <option value="polaroid">Polaroid</option>
                    <option value="9x13">9x13</option>
                    <option value="13x18">13x18</option>
                    <option value="15x21">15x21</option>
                    <option value="20x25">20x25</option>
                    <option value="15x30">15x30</option>
                    <option value="20x30">20x30</option>
                    <option value="30x40">30x40</option>
                    <option value="25x38">25x38</option>
                    <option value="50x70">50x70</option>
                    <option value="40x50">40x50</option>
                </select>
            </div>
            <div class="input-field lol2" id="amount" oninput="change(this)">
                <i class="fas fa-minus" onclick="minus(this)"></i>
                <input type="number" value="1" class="am" min="1">
                <i class="fas fa-plus" onclick="plus(this)"></i>
            </div>
        </div>
    </div>
    `)
}

function change(element) {
    var e = element.parentNode.parentNode;
    var img = e.getElementsByClassName('img')[0].getElementsByTagName('img')[0].getAttribute('data-src');
    var dim = e.getElementsByClassName('lol1')[0].getElementsByTagName('select')[0].value;
    var cnt = e.getElementsByClassName('lol2')[0].getElementsByTagName('input')[0].value;
    console.log(img, dim, cnt);
    var form_data = new FormData();
    form_data.append("image", img);
    form_data.append("session", sessionID);
    form_data.append("size", dim);
    form_data.append("count", cnt);
    var ajax_request = new XMLHttpRequest();

    ajax_request.open("POST", "https://fotostudioart.rs/app/update.php");

    ajax_request.send(form_data);
    if (Math.floor(getImageCount() / 100) > action_count) {
        document.getElementById('add_action').style.display = 'block';
    } else {
        document.getElementById('add_action').style.display = 'none';
    }
}
var timeout = null;
var timeout2 = null;
function showPopup(msg) {
    var elem = document.getElementById('popup');
    elem.innerHTML = msg;
    elem.classList.add('active');
    clearTimeout(timeout);
    timeout = setTimeout(function(){
        elem.classList.remove('active');
    }, 4000);
}
function showSuccess(msg) {
    var elem = document.getElementById('popup2');
    elem.innerHTML = msg;
    elem.classList.add('active');
    clearTimeout(timeout2);
    timeout2 = setTimeout(function(){
        elem.classList.remove('active');
    }, 4000);
}
function deleteItem(elem) {
    var img = elem.parentNode.parentNode.getElementsByTagName('img')[0];
    var id = elem.parentNode.parentNode.id;
    var img_id = img.getAttribute('data-src');
    

    delete loadedImages[id];
    elem.parentNode.parentNode.remove();
    delete loadedImages[elem.parentNode.parentNode.id];
    document.dispatchEvent(countEvent);

    var form_data = new FormData();
    form_data.append("image", img_id);
    form_data.append("session", sessionID);
    var ajax_request = new XMLHttpRequest();

    ajax_request.open("POST", "https://fotostudioart.rs/app/delete.php");

    // ajax_request.addEventListener('load', function(event){
    // });
    ajax_request.send(form_data);
    document.dispatchEvent(countEvent);
}

function duplicate(elem) {

    var e = elem.parentNode.parentNode;
    var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var dim = e.getElementsByClassName('browser-default')[0].value;
    jQuery('#images').append(`
    <div class="item">
        <div id="delete">
            <div class="btn-floating" onclick="deleteItem(this)"><i class="fas fa-times"></i></div>
        </div>
        <div class="img">
            <img id ="source" src="${e.getElementsByTagName('img')[0].src}">
        </div>
        <div class="controls">
            <div class="input-field" id="dimension" style="margin-right:10px">
                <select class="browser-default" id="dim">
                    <option value="10x15" ` + (dim == '10x15' ? 'selected' : '') + `>10x15</option>
                    <option value="polaroid" ` + (dim == 'polaroid' ? 'selected' : '') + `>Polaroid</option>
                    <option value="9x13" ` + (dim == '9x13' ? 'selected' : '') + `>9x13</option>
                    <option value="13x18" ` + (dim == '13x18' ? 'selected' : '') +  `>13x18</option>
                    <option value="15x21" ` + (dim == '15x21' ? 'selected' : '') + `>15x21</option>
                    <option value="20x25" ` + (dim == '20x25' ? 'selected' : '') + `>20x25</option>
                    <option value="15x30" ` + (dim == '15x30' ? 'selected' : '') + `>15x30</option>
                    <option value="20x30" ` + (dim == '20x30' ? 'selected' : '') + `>20x30</option>
                    <option value="30x40" ` + (dim == '30x40' ? 'selected' : '') + `>30x40</option>
                    <option value="25x38" ` + (dim == '25x38' ? 'selected' : '') + `>25x38</option>
                    <option value="50x70" ` + (dim == '50x70' ? 'selected' : '') + `>50x70</option>
                    <option value="40x50" ` + (dim == '40x50' ? 'selected' : '') + `>40x50</option>
                </select>
            </div>
            <div class="input-field" id="amount">
                <i class="fas fa-minus" onclick="minus(this)"></i>
                <input type="number" value="${e.getElementsByClassName('am')[0].value}" class="am">
                <i class="fas fa-plus" onclick="plus(this)"></i>
            </div>
        </div>
    </div>
    `);
}

function plus(elem) {
    elem.parentNode.getElementsByTagName('input')[0].value = parseInt(elem.parentNode.getElementsByTagName('input')[0].value)+1;
    change(elem.parentNode)
    if (Math.floor(getImageCount() / 100) > action_count) {
        document.getElementById('add_action').style.display = 'block';
    } else {
        document.getElementById('add_action').style.display = 'none';
    }
}

function minus(elem) {
    elem.parentNode.getElementsByTagName('input')[0].value = parseInt(elem.parentNode.getElementsByTagName('input')[0].value)-1;
    change(elem.parentNode)
    if (Math.floor(getImageCount() / 100) > action_count) {
        document.getElementById('add_action').style.display = 'block';
    } else {
        document.getElementById('add_action').style.display = 'none';
    }
}

function setsize(size){
    defaultSize = size;
    jQuery('#images .item').each(function(index){
        jQuery(this).find('.browser-default').val(size).change();
    })

    var form_data = new FormData();
    form_data.append("session", sessionID);
    form_data.append("size", size);
    var ajax_request = new XMLHttpRequest();

    ajax_request.open("POST", "https://fotostudioart.rs/app/update_session.php");

    ajax_request.send(form_data);
}

async function deleteAkcija() {
    return new Promise(async (resolve, reject) => {
        if (jQuery('#ne_akcija').is(':checked')) {
            var slots = document.getElementsByClassName('slot');
            for (var i = 0; i < slots.length; i++) {
                console.log(slots[i].id);
                var test = await deleteSlotAsync(slots[i]);
            }
        }
        resolve();
    })
}

var slots_i = 1;
var action_count = 0;

function loadSlots() {
    document.getElementById('slots').innerHTML = '';

    var html = '';
    for (s of slots_data) {
        html += `
            <div class="slot" id="slot_${slots_i}">
                <div class="slot-title">${s['name'].charAt(0).toUpperCase() + s['name'].slice(1)}</div>
                <div class="slot-subtitle">${s['subtitle']}</div>
                <div class="img">
                    <img alt="">
                    <div class="btn add" onclick="slot_id = ${slots_i}; document.getElementById('slotUpload').click()" style="display:block">Dodaj Fotografiju</div>
                    <div class="btn delete" onclick="deleteSlot(this)" style="display:none">Ukloni Fotografiju</div>
                </div>
                <div class="progress" style="display: none;">
                    <p><span class="progress_text">0</span> %</p>
                </div>
            </div>
        `;
        slots_i++;
    }
    document.getElementById('slots').innerHTML = html;
    action_count++;

    if (Math.floor(getImageCount() / 100) > action_count) {
        document.getElementById('add_action').style.display = 'block';
    } else {
        document.getElementById('add_action').style.display = 'none';
    }
}

function getImageCount() {
    var inputs = document.getElementsByClassName('lol2');
    var count = 0;
    for (input of inputs) {
        count += parseInt(input.getElementsByTagName('input')[0].value);
    }
    return count;
}


function addAction() {
    // document.getElementById('slots').innerHTML = '';
    var html = '';
    for (s of slots_data) {
        html += `
            <div class="slot" id="slot_${slots_i}">
                <div class="slot-title">${s['name'].charAt(0).toUpperCase() + s['name'].slice(1)}</div>
                <div class="slot-subtitle">${s['subtitle']}</div>
                <div class="img">
                    <img alt="">
                    <div class="btn add" onclick="slot_id = ${slots_i}; document.getElementById('slotUpload').click()" style="display:block">Dodaj Fotografiju</div>
                    <div class="btn delete" onclick="deleteSlot(this)" style="display:none">Ukloni Fotografiju</div>
                </div>
                <div class="progress" style="display: none;">
                    <p><span class="progress_text">0</span> %</p>
                </div>
            </div>
        `;
        slots_i++;
    }
    document.getElementById('slots').innerHTML += html;
    action_count++;

    if (Math.floor(getImageCount() / 100) > action_count) {
        document.getElementById('add_action').style.display = 'block';
    } else {
        document.getElementById('add_action').style.display = 'none';
    }
}

window.addEventListener('load', function (event) {
    loadSlots();
});

function getPiecePrice(size, pieces) {
    var data = prices[size];
    var cases = Object.keys(data);
    for (case_ of cases) {
        var found = true;
        var operations = case_.split(';');
        for (operation of operations) {
            var op = operation.split(' ');
            if (op[0] == '>=') {
                if (pieces < op[1]) {
                    found = false;
                }
            }
            if (op[0] == '<=') {
                if (pieces > op[1]) {
                    found = false;
                }
            }
            if (op[0] == '>') {
                if (pieces <= op[1]) {
                    found = false;
                }
            }
            if (op[0] == '<') {
                if (pieces >= op[1]) {
                    found = false;
                }
            }
        }
        if (found) {
            return data[case_];
        }
    }
}

function submit() {
    if (!jQuery('#agree').is(':checked')) {
        showPopup('Molimo vas da prihvatite uslove korišćenja');
        return;
    }
    deleteAkcija().then(() => {
        if (!canSend()) {
            showPopup("Molimo vas da sačekate da se fotografije učitaju");
            return;
        }
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
            stepper.setActiveStep(2);
            return;
        };
        jQuery('#success').show();
    
        var images = [];
        var akcija = "Bez akcije";
        if (jQuery('#da_akcija').is(':checked')) akcija = "Akcija";
        // if (jQuery('#poster_akcija').is(':checked')) akcija = "Poster";
        // if (jQuery('#album_akcija').is(':checked')) akcija = "Album";
        // if (jQuery('#sve_akcija').is(':checked')) akcija = "Album i Poster";
        // if (jQuery('#magnet_album_akcija').is(':checked')) akcija = "Magnet i album";
        // if (jQuery('#privezak_album_akcija').is(':checked')) akcija = "Privezak i album";
        var data = {
            'session': sessionID,
            'type': jQuery('#sjaj').is(':checked') ? 'Sjaj' : 'Mat',
            'akcija': akcija,
            // 'ram': jQuery('#ram').is(':checked') ? '1' : '0',
            'ram': '0',
            'cena': findPrice(),
            'images': [],
            'contact': {
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
                'kurir': jQuery('#kurir1').is(':checked') ? 'D Express' : 'Post Express',
            }
        };
    
        for (const key in loadedImages) {
            var elem = document.getElementById(key);
            if (elem === null || !loadedImages[key].loaded) continue;
            var size = '';
            var count = 1;
            try {
                size = elem.getElementsByTagName('select')[0].value;
            } catch(error) {
                size = defaultSize;
            }
            try {
                count = elem.getElementsByTagName('input')[0].value;
            } catch(error) {
                count = 1;
            }
    
            images.push({
                image: loadedImages[key].url,
                size: size,
                count: count,
            })
        }
        jQuery.post({
            'url': 'https://fotostudioart.rs/app/post.php',
            'data': {
                data: JSON.stringify(data)
            },
            success: function(res) {
                jQuery('#loader').hide();
                jQuery('#finished').show();
            }
        })
    });
}

function dodajKomentar(comm) {
    jQuery.post({
        'url': 'https://fotostudioart.rs/app/comment.php',
        'data': {
            comment: comm,
            ime: jQuery('#ime').val(),
            prezime: jQuery('#prezime').val()
        }
    })
}

function finish() {
    if (jQuery('#comment').val().trim() != '') {
        dodajKomentar(jQuery('#comment').val().trim());
    }
    window.location.reload()
}

window.addEventListener('online', () => showSuccess('Povezani ste na internet'));
window.addEventListener('offline', () => showPopup('Izgubili ste internet konekciju'));