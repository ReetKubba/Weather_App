const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require('path');

const app = express();
const PORT = 5006;
const API_KEY = "cd5e301d3168438a1fec505477ec1c20";

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

function maskSuggestions(aqi) {
    if (aqi > 10) {
        return "It's recommended to wear a mask due to high air pollution.";
    } else {
        return "No need to wear a mask for air quality.";
    }
}

function clothingSuggestion(temp) {
    if (temp > 24) {
        return "Wear light clothes for hot weather.";
    } else if (temp < 12) {
        return "Wear warm clothes for cold weather.";
    } else {
        return "Wear moderate clothes for mild weather.";
    }
}



app.get('/weather/:city', async (req, res) => {
    const city = req.params.city;
    const weatherURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&APPID=${API_KEY}`;

    try {
        const weatherResponse = await axios.get(weatherURL);
        const data = weatherResponse.data;
        const lat = data.city.coord.lat;
        const lon = data.city.coord.lon;
        const pollutionURL = `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const pollutionResponse = await axios.get(pollutionURL);

        let forecastBlocks = [];

        for (let i = 0; i < 40 && forecastBlocks.length < 5; i += 8) {
            const forecast = data.list[i];
            const pollution = pollutionResponse.data.list[i];

            const temp = forecast.main.temp;
            const windSpeed = forecast.wind.speed;
            const rainPercentage = forecast.rain ? forecast.rain["3h"] : 0;
            const umbrellaSuggestion = rainPercentage > 0 ? "You should carry an umbrella." : "No need for an umbrella.";
            const clothesSuggestion = clothingSuggestion(temp);
            const maskAdvice = maskSuggestions(pollution.main.aqi);

            forecastBlocks.push({
                Temperature: temp,
                WindSpeed: `${windSpeed} m/s`,
                RainPercentage: `${rainPercentage}%`,
                Umbrella: umbrellaSuggestion,
                Clothes: clothesSuggestion,
                MaskAdvice: maskAdvice
            });
        }

        res.send(forecastBlocks);
    } catch (error) {
        console.error("Error fetching data:", error); 
        res.status(400).json({ error: "Unable to fetch data." });
    }
});
