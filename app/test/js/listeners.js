document.getElementById('zoom_slider').addEventListener('input', function(){
    var percent = document.getElementById('zoom_slider').value;
    document.getElementById('pages').style.transform = `scale(${percent})`;
    // document.getElementById('pages').style.zoom = `${percent}%`;
})

document.getElementById('pull_menu').addEventListener('click', function(){
    toggleMenu()
})

function toggleMenu() {
    document.getElementById('selection_menu').classList.toggle('active');
    document.getElementById('menu_chevron').classList.toggle('active');
    document.getElementById('content_pane').classList.toggle('full');
}

function menuOn() {
    document.getElementById('selection_menu').classList.add('active');
    document.getElementById('menu_chevron').classList.add('active');
    document.getElementById('content_pane').classList.remove('full');
}

document.getElementById('image_uploader').onchange = function(event) {
    for(var count = 0; count < document.getElementById('image_uploader').files.length; count++)  
    {
        upload(count);
    }
}

function openPicker() {
    // document.getElementById('colorpicker').classList.add('active');
    document.getElementById('coloradder').focus();
    document.getElementById('coloradder').click()
}
function closePicker(e) {
    if (e.target.id != 'kurac') {
        document.getElementById('colorpicker').classList.remove('active');
    }
}

function addColor(color) {

    document.getElementById('customColors').innerHTML += `
        <div class="item" style="background: ${document.getElementById('coloradder').value};" onclick="setBackground(this)"></div>
    `
}

function addBorderColor(color) {

    document.getElementById('customBorderColors').innerHTML += `
        <div class="item" style="background: ${document.getElementById('coloradder').value};" onclick="setBorder(this)"></div>
    `
}

function flipPage(elem) {
    console.log(elem);
    var bookPages = document.getElementsByClassName('book_page');
    if (elem.classList.contains('flipped')) {
        elem.classList.remove('flipped');
    } else {
        elem.classList.add('flipped');
    }
    for (var i = 0; i < bookPages.length; i++) {
        bookPages[i].classList.remove('active');
    }
    elem.classList.add('active');
}

jQuery('#shipping2').on('change', function(){
    jQuery('#licno').hide();
    jQuery('#shipping').show();
})
jQuery('#shipping1').change(function(){
    jQuery('#licno').show();
    jQuery('#shipping').hide();
})

jQuery('#box input').change(function(){
    jQuery(this).removeClass('invalid');
})