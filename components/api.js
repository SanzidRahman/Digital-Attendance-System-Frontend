const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMsg = "Something went wrong";
        try {
            const errData = await response.json();
            errorMsg = errData.message || errorMsg;
        } catch (_) { }
        const error = new Error(errorMsg);
        error.status = response.status;
        throw error;
    }
    return response.json();
};

export const api = {
    async get(path) {
        const response = await fetch(`${API_URL}${path}`, {
            method: "GET",
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async post(path, body) {
        const response = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        return handleResponse(response);
    },

    async patch(path, body) {
        const response = await fetch(`${API_URL}${path}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        return handleResponse(response);
    },

    async delete(path) {
        const response = await fetch(`${API_URL}${path}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

export default api;
