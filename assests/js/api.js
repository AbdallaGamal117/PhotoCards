class API {
    // Singleton D P
    static _instanceCache;

    static get instance() {
        if (!this._instanceCache) {
            this._instanceCache = new this();
        }
        return this._instanceCache;
    }

    constructor() {
    }

    // Grab data for single item
    async execSingleItem(id) {
        await this.init('https://jsonplaceholder.typicode.com/photos?id=' + id, this.createEditUI);
    }

    // Grab data for all items
    async execAllItems() {
        await this.init('https://jsonplaceholder.typicode.com/photos?_start=0&_limit=100', this.createMainUI);
    }

    // init api calling
    async init(url, callback) {
        const response = await fetch(url, {
            method: 'GET',
        });

        if (response.status !== 200) {
            throw new Error('Failed to get data from api server ending with status ' + response.status)
        }
        const data = await response.json();

        return await callback(data);
    }

    // Analyze fetched data, set user changes to current api
    analyzeData(data) {
        let deletedData = API.instance.getDeletedData();
        let updatedData = API.instance.getUpdatedData();

        return data.filter(function (value) {
            return deletedData.includes(parseInt(value.id)) != true;
        }).map(function (value) {
            let index = updatedData.findIndex(item => parseInt(item.id) === parseInt(value.id));

            if (index !== -1) {
                if (updatedData[index].title) {
                    value.title = updatedData[index].title;
                }
                if (updatedData[index].thumbnailUrl) {
                    value.thumbnailUrl = updatedData[index].thumbnailUrl;
                }
                if (updatedData[index].url) {
                    value.url = updatedData[index].url;
                }
                if (updatedData[index].albumId) {
                    value.albumId = updatedData[index].albumId;
                }
            }
            return value;
        });
    }

    // create main Ui after analyzing fetched data
    createMainUI(data) {
        const ui = UI.instance;
        let filtered = API.instance.analyzeData(data);

        ui.getAllData(filtered);
        ui.renderCards();

        return ui;
    }

    // create editor page ui
    createEditUI(data) {
        const ui = UI.instance;
        let filtered = API.instance.analyzeData(data);

        ui.getAllData(filtered);
        ui.renderEditPage();

        return ui;
    }

    getDeletedData() {
        return Storage.get('removedItems');
    }

    getUpdatedData() {
        return Storage.get('updatedItems');
    }

    // make changes to items depending on user preference, add it to storage
    updateData(data, old) {
        let id = data.id;
        let updated = API.instance.getUpdatedData();

        let index = updated.findIndex(item => item.id == id);

        if (index == -1) {
            index = updated.push({ id }) - 1;
        }

        if (data.title != old.title) updated[index].title = data.title;
        if (data.thumbnailUrl != old.thumbnailUrl) updated[index].thumbnailUrl = data.thumbnailUrl;
        if (data.url != old.url) updated[index].url = data.url;
        if (data.albumId != old.albumId) updated[index].albumId = data.albumId;

        if (!updated[index].title && !updated[index].thumbnailUrl && !updated[index].url && !updated[index].albumId)
            delete updated[index];

        Storage.save("updatedItems", updated);

        return true;

    }

    // remove item
    deleteElement(id) {
      //  let id = document.querySelector('#delModal').dataset.targetId;
        Storage.save('removedItems', API.instance.getDeletedData().concat([id]));
        UI.instance.removeCard(id);
    }
}

// @ Storage Class to save and get data from localStorage
class Storage {
    static get(name) {
        let str = localStorage.getItem(name);
        if (!str) str = '[]';

        return JSON.parse(str);
    }

    static save(name, value) {
        localStorage.setItem(name, JSON.stringify(value));
    }
}
