function upload(count) {
    var id = Math.random().toString(16).slice(2);
    var form_data = new FormData();
    form_data.append("images[]", document.getElementById('image_uploader').files[count]);
    var ajax_request = new XMLHttpRequest();

    ajax_request.open("POST", "https://fotostudioart.rs/app/upload.php");

    addImage(id);
    ajax_request.upload.addEventListener('progress', function (event) {
        var percent_completed = Math.round((event.loaded / event.total) * 100);
        document.getElementById('upload_' + id).getElementsByClassName('loader')[0].style.height = percent_completed + '%';
        document.getElementById('upload_' + id).getElementsByClassName('loader')[0].innerHTML = percent_completed + '%';
    });

    ajax_request.addEventListener('load', function (event) {


        document.getElementById('image_uploader').value = '';
        var images = JSON.parse(event.target.response);

        editImage(id, images[0]);
    });
    ajax_request.send(form_data);
}

function editImage(id, data) {
    document.getElementById('upload_' + id).style.backgroundImage = `url('https://fotostudioart.rs/app/uploads/${data}')`;
    document.getElementById('upload_' + id).getElementsByClassName('loader')[0].style.display = 'none';
}

function addImage(id) {
    document.getElementById('user_uploads').innerHTML += `
    <div class="item" id="upload_${id}" onclick="addImageToPage('upload_${id}')">
        <div class="loader">
            <span>0%</span>
        </div>
    </div>
    `
}

jQuery.fn.swapWith = function (to) {
    return this.each(function () {
        var copy_to = jQuery(to).clone(true, true);
        var copy_from = jQuery(this).clone(true, true);
        jQuery(to).replaceWith(copy_from);
        jQuery(this).replaceWith(copy_to);
    });
};
function swap(nodeA, nodeB) {
    const parentA = nodeA.parentNode;
    const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

    // Move `nodeA` to before the `nodeB`
    nodeB.parentNode.insertBefore(nodeA, nodeB);

    // Move `nodeB` to before the sibling of `nodeA`
    parentA.insertBefore(nodeB, siblingA);
}

function updatePagesNum() {
    var p = document.getElementsByClassName('page');
    for (var j = 1; j < p.length; j++) {
        p[j].getElementsByClassName('page_num')[0].innerHTML = j;
    }

    var p = document.getElementsByClassName('page');
    for (var j = 0; j < p.length; j++) {
        p[j].getElementsByClassName('canvas')[0].addEventListener('click', function (e) {
            var prarent = this.parentNode.parentNode;
            selectedPage = getPageNum(prarent.id);
            var p = document.getElementsByClassName('page');
            for (var i = 0; i < p.length; i++) {
                p[i].classList.remove('selected');
            }
            document.getElementById(prarent.id).classList.add('selected');
        })
    }
    $.when(jQuery('.img_editor').each(function () {
        jQuery(this).removeClass('ui-resizable');
        jQuery(this).removeClass('ui-draggable');
        jQuery(this).removeClass('ui-draggable-handle edited');
        jQuery(this).unbind('touchend');
        jQuery(this).unbind('touchmove');
        jQuery(this).unbind('mousedown');
        jQuery(this).unbind('mouseup');
        jQuery(this).draggable( 'destroy' )
        jQuery(this).resizable( 'destroy' )
    })).then(function(){
        jQuery('.img_editor').resizable({
            snap: true,
            snapMode: "inner",
            snapTolerance: 5,
            handles: {
                'e': '.anchor'
            },
            aspectRatio: true,
            alsoResizeReverse: jQuery(this),
            stop: function (event, ui) {
                var parent = ui.element.parent();
                ui.element.css({
                    width: ui.element.width() / parent.width() * 100 + "%",
                    height: ui.element.height() / parseFloat(parent.css("padding-bottom")) * 100 + "%"
                });
            },
            resize: function (event, ui) {},
            start: function (event, ui) {
                var dir = event.toElement ? event.toElement : event.originalEvent.target;
            }
        }).draggable({
            snap: '.canvas,.bar,.img_editor',
            snapMode: "inner",
            snapTolerance: 5,
            start: function (event) {
                click.x = event.clientX;
                click.y = event.clientY;
                jQuery('.img_editor').each(function () {
                    jQuery(this).removeClass('edited');
                })
                jQuery(this).addClass('edited');
            },
            drag: function (event, ui) {
                var zoom = document.getElementById('zoom_slider').value
                var original = ui.originalPosition;
                if (zoom != 1)
                    ui.position = {
                        left: (event.clientX - click.x + original.left) / zoom,
                        top: (event.clientY - click.y + original.top) / zoom
                    };

            },
            stop: function () {
                var l = (100 * parseFloat(jQuery(this).css("left")) / parseFloat(jQuery(this).parent().css("width"))) + "%";
                var t = (100 * parseFloat(jQuery(this).css("top")) / parseFloat(jQuery(this).parent().css("height"))) + "%";
                jQuery(this).css("left", l);
                jQuery(this).css("top", t);
            }
        })
    })

}

function deletePage(elem) {
    var pagesElem = elem.parentNode.parentNode.parentNode.parentNode;
    var pageElem = elem.parentNode.parentNode.parentNode;
    var pageNum = getPageNum(pageElem.id);

    pageElem.remove();
    pages.splice(pageNum, 1);
    updatePagesNum()
    var p = document.getElementsByClassName('page');
    for (var j = 0; j < p.length; j++) {
        p[j].getElementsByClassName('canvas')[0].addEventListener('click', function (e) {
            var prarent = this.parentNode.parentNode;
            if (selectedPage == getPageNum(prarent.id)) return;
            jQuery('.img_editor').each(function () {
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
            drop: function (event, ui) {
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
                var final = (h > top) ? h - top + 80 : top - h - 100;
                jQuery(this).append(ui.draggable.css("top", final + 'px'));
            }
        })
    }
}

function movePageDown(elem) {
    var pagesElem = elem.parentNode.parentNode.parentNode.parentNode;
    var pageElem = elem.parentNode.parentNode.parentNode;
    var pageNum = getPageNum(pageElem.id);
    if (pageNum == 0) return;
    var newPos = pageNum + 1;

    var elem1 = pagesElem.getElementsByClassName('page')[pageNum];
    var elem2 = pagesElem.getElementsByClassName('page')[newPos];

    if (elem1 && elem2) {
        swap(document.getElementById(elem1.id),document.getElementById(elem2.id))
        var temp = pages[pageNum];
        pages[pageNum] = pages[newPos];
        pages[newPos] = temp;

        selectedPage++;
    }
    updatePagesNum()
}

function movePageUp(elem) {
    var pagesElem = elem.parentNode.parentNode.parentNode.parentNode;
    var pageElem = elem.parentNode.parentNode.parentNode;
    var pageNum = getPageNum(pageElem.id);
    if (pageNum == 1) return;
    var newPos = pageNum - 1;

    var elem1 = pagesElem.getElementsByClassName('page')[pageNum];
    var elem2 = pagesElem.getElementsByClassName('page')[newPos];

    if (elem1 && elem2) {
        swap(document.getElementById(elem1.id),document.getElementById(elem2.id))
        var temp = pages[pageNum];
        pages[pageNum] = pages[newPos];
        pages[newPos] = temp;
        selectedPage--;
    }
    updatePagesNum()
}