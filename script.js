function calculateRisk() { 
    // Verificar que todos los campos estén completos
    const fields = [
        "age", "ecog", "stageIV", "treatment", "ascites", "parp", "residual", "complications", "complicationsGreaterGrade3"
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
        intercept: -1.162,
        age: 0.409, 
        ecog: 0.193, 
        stageIV: 0.192, 
        treatment: 0.344, 
        ascites: 0.259, 
        parp: -0.396, 
        residual: 0.458, 
        complications: 0.427, 
        complicationsGreaterGrade3: 0.107
    };

    // Coefficients for Relapse, Progression, or Death Risk (PFS) (Logistic Regression)
    const pfsCoefficients = {
        intercept: 0.304,
        age: 0.115,
        ecog: 0.163,
        stageIV: 0.420,
        treatment: 0.598,
        ascites: 0.441,
        parp: -0.344,
        residual: 0.766,
        complications: 0.374,
        complicationsGreaterGrade3: 0.307 // New variable
    };

    // Get values from inputs
    const age = parseFloat(document.getElementById("age").value) || 0;
    const ecog = parseFloat(document.getElementById("ecog").value) || 0;
    const stageIV = parseFloat(document.getElementById("stageIV").value) || 0;
    const treatment = parseFloat(document.getElementById("treatment").value) || 0;
    const ascites = parseFloat(document.getElementById("ascites").value) || 0;
    const parp = parseFloat(document.getElementById("parp").value) || 0;
    const residual = parseFloat(document.getElementById("residual").value) || 0;
    const complications = parseFloat(document.getElementById("complications").value) || 0;
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
        mortalityCoefficients.complications * complications +
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
        pfsCoefficients.complications * complications +
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
    const osRiskScore = (0.298 * age) + (0.220 * ecog) + (0.268 * ascites) + (0.124 * stageIV) + 
                        (0.254 * treatment) + (0.524 * residual) + (0.284 * complications) + 
                        (0.252 * complicationsGreaterGrade3) + (-0.699 * parp);

    // Calculate risk score for PFS
    const pfsRiskScore = (0.099 * age) + (0.128 * ecog) + (0.209 * ascites) + (0.171 * stageIV) + 
                         (0.277 * treatment) + (0.459 * residual) + (0.233 * complications) + 
                         (0.107 * complicationsGreaterGrade3) + (-0.763 * parp);

    // Map risk score to a risk group based on percentiles (OS)
    const osPercentiles = [
        -0.2316, -0.0514, 0.0930, 0.2450, 0.2680, 0.3770, 0.5082, 0.5520, 0.5980, 0.7420, 
        0.7860, 0.8200, 0.9058, 1.0400, 1.0580, 1.1640, 1.3100, 1.3900, 1.5760, 2.2240
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
        -0.3072, 0.0000, 0.0990, 0.2090, 0.2340, 0.3152, 0.4590, 0.5040, 0.5850, 0.6140,
        0.6690, 0.7130, 0.7670, 0.7960, 0.8920, 0.9630, 1.070, 1.2240
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
        1: "71.57",
        6: "66.16",
        8: "65.80",
        10: "55.67",
        11: "54.75",
        12: "47.12",
        13: "43.05",
        14: "44.43",
        15: "39.93",
        16: "54.23",
        17: "30.53",
        18: "35.67",
        19: "21.41",
        20: "33.02"
    };

    // PFS Medians Table
    const pfsMedians = {
        1: "53.18",
        2: "35.97",
        3: "38.10",
        4: "29.21",
        5: "37.71",
        6: "27.28",
        7: "27.18",
        8: "20.26",
        9: "21.15",
        10: "18.56",
        11: "20.95",
        12: "20.26",
        13: "31.41",
        14: "21.84",
        15: "18.13",
        16: "16.92",
        17: "18.98",
        18: "14.39",
        19: "15.28",
        20: "13.54",

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


