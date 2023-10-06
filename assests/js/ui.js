class UI {
    // Singleton D P
    static _instanceCache;

    constructor() {
        // current data 
        this.data = [];
        // all data
        this.fetchedData = [];

        // Specify number of images started at page load and images loaded with scrolling
        this.imagesStarted = 20;
        this.imagesLoaded = 15;
        // returns current index to be added
        this.currIndex = 0;
        
        this.autoLoad = true;
    }

    static get instance() {
        if (!this._instanceCache) {
            this._instanceCache = new this();
        }
        return this._instanceCache;
    }

    // get data from api and assign it
    getAllData(data) {
        this.fetchedData = data;

        this.assignCurrentData();
    }

    // get set of data to be loaded on page load / on scroll
    assignCurrentData() {
        let numberToAssign = (this.currIndex == 0 ? this.imagesStarted : this.imagesLoaded);

        if (this.currIndex + numberToAssign > this.fetchedData.length) {
            numberToAssign = this.fetchedData.length - this.currIndex;
        }

        this.data = this.fetchedData.slice(this.currIndex, numberToAssign + this.currIndex);
        this.currIndex = this.currIndex + numberToAssign;

    }

    // just a function to make creating element simpler
    createElement(tagName, className = '', id = '', attr = []) {
        let node = document.createElement(tagName);
        if (className != '') {
            node.className = className;
        }
        if (id != '') {
            node.id = id;
        }
        if (attr !== [] && typeof attr == 'object') {
            attr.forEach(function (value, i) {
                if (typeof attr[i] == 'object') {
                    node.setAttribute(attr[i].name, attr[i].value);
                }
            })
        }
        return node;
    }

    makeCard(data) {
        let img = this.createElement('img', 'w-100 img-fluid card-img-top', 'thumb-' + data.id,
            [{ name: 'src', value: data.thumbnailUrl },
            { name: 'alt', value: data.title.substring(0, 20) + (data.title.length > 20 ? '...' : '') }]);

        let col = this.createElement('div', 'p-2', 'col-' + data.id);
        let card = this.createElement('div', 'card p-0', 'card-' + data.id)
        card.appendChild(img);

        let cardBody = this.createElement('div', 'card-body');
        cardBody.innerHTML = `<div class="small mb-2 text-secondary">ImageID: ${data.id}<br />AlbumID: ${data.albumId}</div>`;
        let cardTitle = this.createElement('h5', 'card-title mb-3 text-center');
        cardTitle.innerText = data.title;
        
        let cardFooter = this.createElement('div', 'card-footer d-flex justify-content-center align-items-center');
        let fullscreenIcon = this.createElement('span', 'icon ic-fullscreen ic-clickable mx-2', '', [{ name: 'title', value: 'Full Screen' }]);
        let editIcon = this.createElement('span', 'icon ic-edit ic-clickable mx-2', '', [{ name: 'title', value: 'Edit' }]);
        let deleteIcon = this.createElement('span', 'icon ic-remove ic-clickable mx-1', 'del-' + data.id, [
            // { name: 'data-bs-toggle', value: 'modal' },
            // { name: 'data-bs-target', value: '#delModal' },
            // { name: 'data-target-id', value: data.id },
            // { name: 'tabindex', value: 1 },
            { name: 'title', value: 'Remove' }
        ]);

        fullscreenIcon.addEventListener('click', function (e) {
            let viewModal = new bootstrap.Modal(document.getElementById('imgModal'));
            document.querySelector('#imgModal img').src = data.url;
            viewModal.show();
        });

        editIcon.addEventListener('click', function (e) {
            location.href = './edit.html?id=' + data.id;
        });

        deleteIcon.addEventListener('click', function (e) {
            let delModal = new bootstrap.Modal(document.getElementById('delModal'));
            delModal.show();

            document.getElementById('delBtn').addEventListener('click', e => {
                API.instance.deleteElement(data.id);
                delModal.hide();
            });
            document.querySelector('#modalElmId').innerText = data.id;
            delModal.show();
        });

        cardBody.appendChild(cardTitle);
        card.appendChild(cardBody);

        cardFooter.appendChild(fullscreenIcon);
        cardFooter.appendChild(editIcon);
        cardFooter.appendChild(deleteIcon);
        card.appendChild(cardFooter);

        col.appendChild(card);

        return col;
    }

    // Render Cards for first time
    renderCards() {
        document.querySelector('.posts .container').appendChild(this.createElement('div', 'row content d-grid'));
        this.addCards();

        // New Elements Loader either using button or auto loading
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && this.autoLoad == true) {
                this.newCards();
                if (this.data.length == 0) {
                    document.querySelector('.virtual').classList.add('hidden');
                } else {
                    document.querySelector('.virtual').classList.remove('hidden');
                }
            } else if (this.autoLoad == false) {
                document.querySelector('.virtual').classList.add('hidden');
                document.querySelector('#autoLoadBtn').classList.add('on');

                document.querySelector('#autoLoadBtn button').addEventListener('click', e => {
                    this.newCards();
                    if (this.data.length == 0) {
                        document.querySelector('#autoLoadBtn').classList.remove('on');
                    }
                });
            }
        });

        observer.observe(document.querySelector('#loading'));

    }

    // add cards from current data
    addCards() {
        let rowDiv = document.querySelector('.posts .row');

        for (let i = 0; i < this.data.length; i++) {
            rowDiv.appendChild(this.makeCard(this.data[i]));
        }
    }

    // add new cards
    newCards() {
        this.assignCurrentData();
        this.addCards();
    }

    // remove element
    removeCard(id) {
        document.querySelector('#col-' + id).remove();

        let modalSuccess = new bootstrap.Modal(document.getElementById('successModal'))
        modalSuccess.show();
        setTimeout(function () {
            modalSuccess.hide();
        }, 2000);
    }

    // Create Editor Page
    renderEditPage() {
        let data = this.data[0];

        let titleField = document.querySelector('input[name="title"]');
        let urlField = document.querySelector('input[name="url"]');
        let fullImg = document.querySelector('#imgUrl');
        let thumbField = document.querySelector('input[name="thumbnailUrl"]');
        let thumbImg = document.querySelector('#imgThumb');
        let albumIdField = document.querySelector('#inputAlbumId');

        // set id on title
        document.querySelector('#editForm .h2').appendChild(document.createTextNode(data.id));
        // set Album id on its input
        albumIdField.value = data.albumId;
        // set title on its input
        titleField.value = data.title;
        // set image on img tag
        urlField.value = data.url;
        fullImg.src = data.url;
        fullImg.classList.add('mt-2');
        // set thumb url on input and img
        thumbField.value = data.thumbnailUrl;
        thumbImg.src = data.thumbnailUrl;
        thumbImg.classList.add('mt-2');

        // Assign reset values to original data
        document.querySelector('#editForm button[type=reset]').addEventListener('click', function (e) {
            e.preventDefault();
            albumIdField.value = data.albumId;
            titleField.value = data.title;
            urlField.value = data.url;
            fullImg.src = data.url;
            thumbField.value = data.thumbnailUrl;
            thumbImg.src = data.thumbnailUrl;
        });

        ['paste', 'focusout'].forEach(function (evt) {
            urlField.addEventListener(evt, e => { fullImg.src = urlField.value; });
        });

        ['paste', 'focusout'].forEach(function (evt) {
            thumbField.addEventListener(evt, e => { thumbImg.src = thumbField.value; });
        });

        let modalConfirm = new bootstrap.Modal(document.getElementById('confirmModal'));

        document.querySelector('#submitBtn').addEventListener('click', e => modalConfirm.show());
        document.querySelector('#saveBtn').addEventListener('click', e => {
            let newData = [];
            newData = {
                id: data.id,
                title: titleField.value,
                url: urlField.value,
                thumbnailUrl: thumbField.value,
                albumId: albumIdField.value
            };
            API.instance.updateData(newData, this.data);

            modalConfirm.hide();

            let modalSuccess = new bootstrap.Modal(document.getElementById('successModal'))
            modalSuccess.show();
            setTimeout(function () {
                modalSuccess.hide();
            }, 1000);
            document.getElementById('successModal').addEventListener('hidden.bs.modal', e => {
                location.href = './index.html';
            });
        });
    }

    createConfirmModal(id, title, desc, btnTxt, btnClassName, btnId = '', cancelBtnTxt = 'Cancel') {
        let parentNode = this.createElement('div', 'modal fade', id + 'Modal', [
            { name: 'tabindex', value: '-1' },
            { name: 'aria-labelledby', value: id + 'ModalLabel' },
            { name: 'aria-hidden', value: 'true' },
            { name: 'data-target-id', value: '' }
        ]);
        let modalDialogNode = this.createElement('div', 'modal-dialog');
        let modalContentNode = this.createElement('div', 'modal-content');
        let modalHeaderNode = this.createElement('div', 'modal-header');
        let modalTitle = this.createElement('h1', 'modal-title fs-5', id + 'ModalLabel');
        modalTitle.append(title);
        let modalTitleCloseIcon = this.createElement('button', 'btn-close', '', [
            { name: 'type', value: 'button' },
            { name: 'data-bs.dismiss', value: 'modal' },
            { name: 'aria-label', value: 'Close' }
        ]);

        modalHeaderNode.appendChild(modalTitle);
        modalHeaderNode.appendChild(modalTitleCloseIcon);
        modalContentNode.appendChild(modalHeaderNode);

        let modalBodyNode = this.createElement('div', 'modal-body');
        modalBodyNode.innerHTML = desc;
        modalContentNode.appendChild(modalBodyNode);

        let modalFooterNode = this.createElement('div', 'modal-footer');
        let modalCancelBtnNode = this.createElement('button', 'btn btn-secondary', '', [
            { name: 'type', value: 'button' },
            { name: 'data-bs-dismiss', value: 'modal' }
        ]);
        modalCancelBtnNode.append(cancelBtnTxt);

        let modalSubmitBtnNode = this.createElement('button', 'btn ' + btnClassName, btnId, [{
            name: 'type', value: 'button'
        }]);
        modalSubmitBtnNode.append(btnTxt);
        modalFooterNode.appendChild(modalCancelBtnNode);
        modalFooterNode.appendChild(modalSubmitBtnNode);
        modalContentNode.appendChild(modalFooterNode);

        modalDialogNode.appendChild(modalContentNode);
        parentNode.appendChild(modalDialogNode);

        document.body.appendChild(parentNode);
        return parentNode;
    }

    createSuccessModal(id, title, desc) {
        let parentNode = this.createElement('div', 'modal fade', id + 'Modal', [
            { name: 'tabindex', value: '-1' },
            { name: 'aria-labelledby', value: id + 'ModalLabel' },
            { name: 'aria-hidden', value: 'true' },
            { name: 'data-target-id', value: '' }
        ]);
        let modalDialogNode = this.createElement('div', 'modal-dialog');
        let modalContentNode = this.createElement('div', 'modal-content');
        let modalHeaderNode = this.createElement('div', 'modal-header');
        let modalTitle = this.createElement('h1', 'modal-title fs-5', id + 'ModalLabel');
        modalTitle.append(title);
        let modalTitleCloseIcon = this.createElement('button', 'btn-close', '', [
            { name: 'type', value: 'button' },
            { name: 'data-bs.dismiss', value: 'modal' },
            { name: 'aria-label', value: 'Close' }
        ]);

        modalHeaderNode.appendChild(modalTitle);
        modalHeaderNode.appendChild(modalTitleCloseIcon);
        modalContentNode.appendChild(modalHeaderNode);

        let modalBodyNode = this.createElement('div', 'modal-body');
        modalBodyNode.innerHTML = desc;
        modalContentNode.appendChild(modalBodyNode);

        modalDialogNode.appendChild(modalContentNode);
        parentNode.appendChild(modalDialogNode);

        document.body.appendChild(parentNode);
        return parentNode;
    }
}