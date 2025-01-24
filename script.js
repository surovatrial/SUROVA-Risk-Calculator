function calculateRisk() { 
    // Verificar que todos los campos estén completos
    const fields = [
        "age", "ecog", "stageIV", "treatment", "ascites", "parp", "residual", "complicationsGreaterGrade3"
    ];

    let allFieldsFilled = true;
    fields.forEach(field => {
        const value = document.getElementById(field).value;
        if (!value) {
            allFieldsFilled = false;
        }
    });

    if (!allFieldsFilled) {
        alert('Please complete all fields before calculating the risk.');
        return;
    }

    // Coefficients for Mortality Risk (Logistic Regression)
    const mortalityCoefficients = {
        intercept: -1.077,
        age: 0.417, 
        ecog: 0.194, 
        stageIV: 0.197, 
        treatment: 0.303, 
        ascites: 0.279, 
        parp: -0.405, 
        residual: 0.468, 
        complicationsGreaterGrade3: 0.416
    };

    // Coefficients for Relapse, Progression, or Death Risk (PFS) (Logistic Regression)
    const pfsCoefficients = {
        intercept: 0.491,
        age: 0.079,
        ecog: 0.121,
        stageIV: 0.445,
        treatment: 0.590,
        ascites: 0.473,
        parp: -1.091,
        residual: 0.767,
        complicationsGreaterGrade3: 0.630 // New variable
    };

    // Get values from inputs
    const age = parseFloat(document.getElementById("age").value) || 0;
    const ecog = parseFloat(document.getElementById("ecog").value) || 0;
    const stageIV = parseFloat(document.getElementById("stageIV").value) || 0;
    const treatment = parseFloat(document.getElementById("treatment").value) || 0;
    const ascites = parseFloat(document.getElementById("ascites").value) || 0;
    const parp = parseFloat(document.getElementById("parp").value) || 0;
    const residual = parseFloat(document.getElementById("residual").value) || 0;
    const complicationsGreaterGrade3 = parseFloat(document.getElementById("complicationsGreaterGrade3").value) || 0;

    // Logistic regression formula for Mortality Risk
    const mortalityLogit = mortalityCoefficients.intercept +
        mortalityCoefficients.age * age +
        mortalityCoefficients.ecog * ecog +
        mortalityCoefficients.stageIV * stageIV +
        mortalityCoefficients.treatment * treatment +
        mortalityCoefficients.ascites * ascites +
        mortalityCoefficients.parp * parp +
        mortalityCoefficients.residual * residual +
        mortalityCoefficients.complicationsGreaterGrade3 * complicationsGreaterGrade3;

    const mortalityProbability = 1 / (1 + Math.exp(-mortalityLogit));
    document.getElementById("resultMortality").textContent = (mortalityProbability * 100).toFixed(2) + "%";

    // Logistic regression formula for PFS Risk
    const pfsLogit = pfsCoefficients.intercept +
        pfsCoefficients.age * age +
        pfsCoefficients.ecog * ecog +
        pfsCoefficients.stageIV * stageIV +
        pfsCoefficients.treatment * treatment +
        pfsCoefficients.ascites * ascites +
        pfsCoefficients.parp * parp +
        pfsCoefficients.residual * residual +
        pfsCoefficients.complicationsGreaterGrade3 * complicationsGreaterGrade3;

    const pfsProbability = 1 / (1 + Math.exp(-pfsLogit));
    document.getElementById("resultPFS").textContent = (pfsProbability * 100).toFixed(2) + "%";

    // Categorize risk for Mortality
    let mortalityCategory;
    if (mortalityProbability < 0.33) mortalityCategory = "Low";
    else if (mortalityProbability < 0.5) mortalityCategory = "Moderate";
    else if (mortalityProbability < 1) mortalityCategory = "High";
    else mortalityCategory = "Very High";

    document.getElementById("categoryMortality").textContent = mortalityCategory;

    // Update traffic light
    const trafficLightContainer = document.getElementById("traffic-light");
    trafficLightContainer.innerHTML = ""; 
    const img = document.createElement("img");
    img.alt = `${mortalityCategory} risk traffic light`;
    
    if (mortalityCategory === "Low") {
        img.src = "semaforo_green.jpg";
    } else if (mortalityCategory === "Moderate") {
        img.src = "semaforo_yellow.jpg";
    } else if (mortalityCategory === "High") {
        img.src = "semaforo_red.jpg";
    }
    
    img.style.width = "50px";
    img.style.height = "auto";
    trafficLightContainer.appendChild(img);

    // Calculate risk score for survival median assignment (OS)
    const osRiskScore = (0.305 * age) + (0.232 * ecog) + (0.281 * ascites) + (0.136 * stageIV) + 
                        (0.245 * treatment) + (0.542 * residual) +
                        (0.449 * complicationsGreaterGrade3) + (-0.708 * parp);

    // Calculate risk score for PFS
    const pfsRiskScore = (0.098 * age) + (0.127 * ecog) + (0.210 * ascites) + (0.169 * stageIV) + 
                         (0.269 * treatment) + (0.469 * residual) +
                         (0.287 * complicationsGreaterGrade3) + (-0.749 * parp);

    // Map risk score to a risk group based on percentiles (OS)
    const osPercentiles = [
       -0.4030, -0.1220, 0.0000, 0.2320, 0.2810, 
        0.3050, 0.4910, 0.5260, 0.5860, 0.6650, 
        0.7580, 0.8230, 0.8470, 0.9750, 1.0630, 
        1.1280, 1.2150, 1.3730, 1.6050
    ];

    let osRiskGroup = 20; // Default to highest group
    for (let i = 0; i < osPercentiles.length; i++) {
        if (osRiskScore <= osPercentiles[i]) {
            osRiskGroup = i + 1;
            break;
        }
    }

    // Map risk score to a risk group based on percentiles (PFS)
    const pfsPercentiles = [
        -0.3632, -0.0006, 0.0652, 0.1270, 0.2100, 
        0.2870, 0.3370, 0.4350, 0.4790, 0.5360, 
        0.5950, 0.6480, 0.6940, 0.7040, 0.7750, 
        0.8060, 0.9040, 1.0460, 1.1730 // Representa el rango superior para el último grupo
    ];
    let pfsRiskGroup = 20; // Default to highest group
    for (let i = 0; i < pfsPercentiles.length; i++) {
        if (pfsRiskScore <= pfsPercentiles[i]) {
            pfsRiskGroup = i + 1;
            break;
        }
    }

    // Survival medians table (OS)
    const survivalMedians = {
        3: "70.82",
        5: "70.43",
        6: "65.25",
        7: "73.71",
        8: "67.48",
        9: "67.02",
        10: "60.75",
        11: "55.67",
        12: "50.30",
        13: "53.84",
        14: "46.16",
        15: "42.46",
        16: "51.25",
        17: "43.41",
        18: "30.53",
        19: "23.61",
        20: "33.15",
    };

    // PFS Medians Table
    const pfsMedians = {
        1: "53.18",
        2: "38.36",
        3: "30.75",
        4: "29.93",
        5: "21.74",
        6: "24.75",
        7: "22.82",
        8: "25.61",
        9: "25.61",
        10: "17.12",
        11: "18.62",
        12: "19.31",
        13: "22.49",
        14: "19.48",
        15: "20.13",
        16: "15.93",
        17: "17.21",
        18: "15.41",
        19: "14.46",
        20: "13.71"
    };

    // Assign median survival (OS) or message
    const medianSurvival = survivalMedians[osRiskGroup];
    const survivalMessage = medianSurvival 
        ? `${medianSurvival} months.`
        : "Not Reached";

    document.getElementById("medianSurvival").textContent = survivalMessage;

    // Assign median PFS or message
    const medianPFS = pfsMedians[pfsRiskGroup];
    const pfsMessage = medianPFS 
        ? `${medianPFS} months.`
        : "Not Reached";

    document.getElementById("medianPFS").textContent = pfsMessage;
}


