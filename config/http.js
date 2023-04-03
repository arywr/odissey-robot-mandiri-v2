module.exports = {
    getHeaders: (token) => {
        return ({
            "Content-Type": "application/json",
		    "Authorization": `Bearer ${token}`,
		    "Cache-Control": "no-cache"
        })
    }
}