const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

const getDeviceId = () => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("deviceId");
    if (!id) {
        // Generate a random unique device ID prefixing with 'dev-'
        id = "dev-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("deviceId", id);
    }
    return id;
};

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const deviceId = getDeviceId();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(deviceId ? { "x-device-id": deviceId } : {})
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
    getDeviceId, // export helper in case login or other components need to display/use it

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
