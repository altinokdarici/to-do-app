const url = "/api";

class RecordsRepositoryApi {
    async get() {
        const response = await fetch(url, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(response.status);
        }

        const record = await response.json();

        return record;
    }

    async save(record) {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(record),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(response.status);
        }

        const postedItem = await response.json();

        return postedItem;
    }

    async update(id, record) {
        const response = await fetch(`${url}/${id}`, {
            method: "PUT",
            body: JSON.stringify(record),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(response.status);
        }

        const updatedItem = await response.json();

        return updatedItem;
    }

    async delete(id) {
        const response = await fetch(`${url}/${id}`, {
            method: "DELETE",
        })

        if (!response.ok) {
            throw new Error(response.status);
        }
    }

}