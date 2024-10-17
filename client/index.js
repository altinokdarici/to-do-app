document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
});

const url = "/api";
const urlUser = "/api/user";

async function getRecords() {
    const response = await fetch(url, {
        method: "GET"
    });
    if (response.ok) {
        const record = await response.json();

        return record;
    }
    alert("Error");
}

async function putRecord(id, item) {
    const response = await fetch(`${url}/${id}`, {
        method: "PUT",
        body: JSON.stringify(item),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.ok) {
        const updatedItem = await response.json();

        return updatedItem;
    }
    alert("Error! Item is not updated.")
}

async function postRecord(item) {
    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(item),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.ok) {
        const postedItem = await response.json();
        return postedItem;
    }
    alert("item is not added");
}

async function deleteRecord(id) {
    const response = await fetch(`${url}/${id}`, {
        method: "DELETE",
    })

    return response.ok;
}

async function getUser() {
    const response = await fetch(urlUser, {
        method: "GET"
    });

    if (response.ok) {
        const user = await response.json();

        return user;
    }
    alert("Error");
}

function createItem(item) {
    //create checkbox
    const checkbox = document.createElement("input");
    checkbox.classList.add("form-check-input", "me-1");
    checkbox.setAttribute("type", "checkbox");
    checkbox.checked = item.is_completed;
    checkbox.id = item.id;

    //create to do part
    const toDo = document.createElement("div");
    toDo.textContent = item.title;
    toDo.contentEditable = true;
    toDo.classList.add("form-control", "bg-transparent", "shadow-none", "text-wrap", "overflow-hidden", "border-0");

    //create delete button
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("btn", "btn-light", "px-1", "py-0");
    deleteButton.innerHTML = '<i class="bi bi-trash3-fill"></i>';

    //create list card div
    const listCard = document.createElement("li");
    listCard.classList.add("list-group-item", "d-flex", "justify-content-between", "border", "border-0", "border-bottom", "align-items-center", "gap-3");

    //append left and right part in list card div
    listCard.append(checkbox, toDo, deleteButton);

    //update the list card with is_complete
    checkbox.onchange = createOnCheckBoxInputChange(item, toDo, listCard, deleteButton);
    if (item.is_completed) {
        toDo.classList.add("text-decoration-line-through", "text-body-tertiary");
        listCard.classList.add("bg-secondary-subtle");
        toDo.contentEditable = false;
    } else {
        toDo.classList.remove("text-decoration-line-through", "text-body-tertiary");
        listCard.classList.remove("bg-secondary-subtle");
        toDo.contentEditable = true;
    }

    //asigning delete function to delete button 
    deleteButton.onclick = createOnClickDelete(item, listCard, deleteButton);

    //getting the editted title
    toDo.onblur = createOnToDoBlur(item, toDo);

    return listCard;
}

async function onClickAddNote() {
    const input = document.getElementById("new-note");
    const title = input.value;
    if (!title || title.length === 0) {
        alert("There is nothing to be added");
        return;
    }
    const newItem = {
        title,
    };

    const newNote = await postRecord(newItem);

    lists.append(createItem(newNote));
    records.push(newNote);

    document.getElementById("new-note").value = "";
}

function onNewNoteKeyUp(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action (like a newline in the textarea)
        onClickAddNote(); // Call the function to add a note
    }
}

function createOnCheckBoxInputChange(item, toDo, listCard) {
    return async function (event) {
        let updated = {};
        if (event.currentTarget.checked) {
            updated = {
                title: item.title,
                is_completed: true
            }
            toDo.classList.add("text-decoration-line-through", "text-body-tertiary");
            listCard.classList.add("bg-secondary-subtle");
            toDo.contentEditable = false;
        } else {
            updated = {
                title: item.title,
                is_completed: false
            }
            toDo.classList.remove("text-decoration-line-through", "text-body-tertiary");
            listCard.classList.remove("bg-secondary-subtle");
            toDo.contentEditable = true;
        }

        const updatedItem = await putRecord(item.id, updated);

        for (const record of records) {
            if (record.id === updatedItem.id) {
                record.is_completed = updatedItem.is_completed;
                break;
            }
        }
    }
}

function createOnClickDelete(item, listCard, deleteButton) {
    return async function () {
        deleteButton.disabled = true;
        if (await deleteRecord(item.id)) {
            listCard.remove();
            for (const record of records) {
                if (record.id === item.id) {
                    records.splice(records.indexOf(record), 1);
                }
            }
        } else {
            alert("The item cannot be deleted");
            deleteButton.disabled = false;
        }
    }
}

function createOnToDoBlur(item, toDo) {
    return async function () {
        if (!toDo.textContent || toDo.textContent.length === 0) {
            const willBeDeleted = await deleteRecord(item.id);
            if (willBeDeleted) {
                lists.innerHTML = "";
                for (const record of records) {
                    if (record.id === item.id) {
                        records.splice(records.indexOf(record), 1);
                    } else {
                        lists.append(createItem(record));
                    }
                }
            }

        } else {
            const updated = {
                title: toDo.textContent
            }

            const updatedItem = await putRecord(item.id, updated);
            for (const record of records) {
                if (record.id === item.id) {
                    record.title = updatedItem.title;
                }
            }
        }
    }
}

//debounce
let searchTimeOutId;
function onSearchKeyUp(event) {
    if (searchTimeOutId) {
        clearTimeout(searchTimeOutId);
        searchTimeOutId = undefined;
    }
    const searchedItem = event.currentTarget.value;

    searchTimeOutId = setTimeout(async () => {
        lists.innerHTML = "";
        for (const record of records) {
            if (!searchedItem || searchedItem.length === 0 || record.title.toLowerCase().includes(searchedItem.toLowerCase())) {
                lists.append(createItem(record));
            }
        }

    }, 400);
}

let records;
let lists;
window.onpageshow = async () => {
    records = await getRecords();
    const user = await getUser();
    const img = document.getElementById("user-img");
    img.setAttribute("src", `${user.picture}`);
    //get ul div from html
    lists = document.getElementById("lists");

    for (const record of records) {
        lists.append(createItem(record));
    }
}