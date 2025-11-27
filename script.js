// Hämtning av API
// POST, Sparar favoriter till mock API JSONPlaceholder
async function postFavoriteToServer(city) {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: "Favorite city",
            body: city,
            userId: 1
        })
    });

    const data = await response.json();

    // Sparar ID
    mockApiIds[city] = data.id;
    saveFavorites();

    console.log("POST skickad:", data);
}

// DELETE, tar bort stad från JSONPlaceholder via ID
async function deleteFavoriteFromServer(id) {
    if (!id) return;

    await fetch("https://jsonplaceholder.typicode.com/posts/" + id, {
        method: "DELETE"
    });

    console.log("DELETE skickad för ID:", id);
}

// Hämtar koordinater för en stad
async function getCoordinates(city) {
    const url = "https://geocoding-api.open-meteo.com/v1/search?name=" + city;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("Staden hittades inte");
    }

    return data.results[0]; // Returnerar objekt med lat, lon, namn
}

// Vi hämtar väderdata för koordinater
async function getWeather(lat, lon) {
    const url =
        "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
        "&longitude=" + lon +
        "&hourly=temperature_2m,weathercode";
    const response = await fetch(url);
    const data = await response.json();
    return data.hourly; // Returnerar objekt med time, temperature_2m, weathercode
}

// vi omvandlar väderkod till emoji
function weatherEmoji(code) {
    const emojis = {
        0: "☀️", 1: "🌤️", 2: "☁️", 3: "☁️",
        45: "🌫️", 48: "🌫️",
        51: "🌦️", 53: "🌦️", 55: "🌦️",
        61: "🌧️", 63: "🌧️", 65: "🌧️",
        71: "❄️", 73: "❄️", 75: "❄️",
        80: "🌦️", 81: "🌦️", 82: "🌦️",
        95: "⛈️", 96: "⛈️", 99: "⛈️"
    };
    return emojis[code] || "";
}

// Visar de 24 närmaste timmarna för en stad
async function showWeather(city) {
    const weatherBox = document.getElementById("weatherResult");

    if (!city) {
        weatherBox.innerHTML = "<p>Skriv in en stad.</p>";
        return;
    }

    try {
        // Hämtar koordinater
        const location = await getCoordinates(city);

        // Hämtar väderdata
        const weather = await getWeather(location.latitude, location.longitude);

        // vi bygger HTML lista för de 24 första timmarna
        let html = "<h2>" + location.name + "</h2><ul>";

        for (let i = 0; i < 24 && i < weather.time.length; i++) {
            const time = new Date(weather.time[i])
                .toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
            const temp = weather.temperature_2m[i];
            const code = weather.weathercode[i];

            html += "<li>" + time + "" + weatherEmoji(code) + " " + temp + "°C</li>";
        }

        html += "</ul>";
        weatherBox.innerHTML = html;

    } catch (error) {
        // Visar felmeddelande om stad inte hittas
        weatherBox.innerHTML = "<p>" + error.message + "</p>";
    }
}

// Refererar till listan i HTML
const favoritesList = document.getElementById("favoritesList");

// Vi hämtar favoriter från sessionStorage eller startar en tom lista
let favorites = JSON.parse(sessionStorage.getItem("favorites")) || [];

// --- MOCK API DATA LINKNING ---
let mockApiIds = JSON.parse(sessionStorage.getItem("mockApiIds")) || {}; 
// Exempel: { "Stockholm": 101, "Paris": 55 }

// Vi sparar favoriter till sessionStorage
function saveFavorites() {
    sessionStorage.setItem("favorites", JSON.stringify(favorites));
    sessionStorage.setItem("mockApiIds", JSON.stringify(mockApiIds));
    renderFavorites();
}

// Vi visar favoriter i listan
function renderFavorites() {
    favoritesList.innerHTML = ""; // Rensa lista

    favorites.forEach((city, index) => {
        const li = document.createElement("li");

        // Vi lägger till så att favoriterna är klickbara
        const span = document.createElement("span");
        span.textContent = city;
        span.style.cursor = "pointer";
        span.addEventListener("click", () => showWeather(city));

        // Ta bort en favorit
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Ta bort";
        removeBtn.addEventListener("click", () => {
            deleteFavoriteFromServer(mockApiIds[city]); // DELETE → JSONPlaceholder
            favorites.splice(index, 1);
            delete mockApiIds[city];
            saveFavorites();
        });

        li.appendChild(span);
        li.appendChild(removeBtn);
        favoritesList.appendChild(li);
    });
}

// Vi lägger till "lägg till favorit" knappen
document.getElementById("addFavoriteBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (!city || favorites.includes(city)) return;

    favorites.push(city);
    saveFavorites();

    postFavoriteToServer(city); // POST → JSONPlaceholder
});

// Vi hämtar vädret från favoritlistan
document.getElementById("getWeatherBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    showWeather(city);
});

// Vi renderar favoriter när sidan laddas
renderFavorites();
