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

    // Coefficients
    const coefficients = {
        intercept: -1.162,
        age: 0.409, // Updated value
        ecog: 0.193, // Updated value
        stageIV: 0.192, // Updated value
        treatment: 0.344, // Updated value
        ascites: 0.259, // Updated value
        parp: -0.396, // Updated value
        residual: 0.458, // Updated value
        complications: 0.427, // Updated value
        complicationsGreaterGrade3: 0.107 // New variable
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

    // Logistic regression formula
    const logit = coefficients.intercept +
        coefficients.age * age +
        coefficients.ecog * ecog +
        coefficients.stageIV * stageIV +
        coefficients.treatment * treatment +
        coefficients.ascites * ascites +
        coefficients.parp * parp +
        coefficients.residual * residual +
        coefficients.complications * complications +
        coefficients.complicationsGreaterGrade3 * complicationsGreaterGrade3;

    const probability = 1 / (1 + Math.exp(-logit));
    document.getElementById("result").textContent = (probability * 100).toFixed(2) + "%";

    // Categorize risk
    let category;
    if (probability < 0.33) category = "Low";
    else if (probability < 0.5) category = "Moderate";
    else if (probability < 1) category = "High";
    else category = "Very High";

    document.getElementById("category").textContent = category;

    // Update traffic light
    const trafficLightContainer = document.getElementById("traffic-light");
    trafficLightContainer.innerHTML = ""; // Clear existing content
    const img = document.createElement("img");
    img.alt = `${category} risk traffic light`;

    if (category === "Low") {
        img.src = "semaforo_green.jpg";
    } else if (category === "Moderate") {
        img.src = "semaforo_yellow.jpg";
    } else if (category === "High") {
        img.src = "semaforo_red.jpg";
    }

    img.style.width = "50px";
    img.style.height = "auto";
    trafficLightContainer.appendChild(img);

    // Calculate risk score for survival median assignment
    const riskScore = (0.298 * age) + (0.220 * ecog) + (0.268 * ascites) + (0.124 * stageIV) + 
                      (0.254 * treatment) + (0.524 * residual) + (0.284 * complications) + 
                      (0.252 * complicationsGreaterGrade3) + (-0.699 * parp);

    // Map risk score to a risk group based on percentiles
    const percentiles = [
        -0.2316, -0.0514, 0.0930, 0.2450, 0.2680, 0.3770, 0.5082, 0.5520, 0.5980, 0.7420, 
        0.7860, 0.8200, 0.9058, 1.0400, 1.0580, 1.1640, 1.3100, 1.3900, 1.5760, 2.2240
    ];

    let riskGroup = 20; // Default to highest group
    for (let i = 0; i < percentiles.length; i++) {
        if (riskScore <= percentiles[i]) {
            riskGroup = i + 1;
            break;
        }
    }

    // Survival medians table
    const survivalMedians = {
        1: "71.574",
        6: "66,164",
        8: "65.803",
        10: "55.672",
        11: "54.754",
        12: "47.115",
        13: "43.049",
        14: "44.426",
        15: "39.934",
        16: "54.230",
        17: "30.525",
        18: "35.672",
        19: "21.410",
        20: "33.016"
        // Remaining groups without a median
    };

    // Assign median survival or message
    const medianSurvival = survivalMedians[riskGroup];
    const survivalMessage = medianSurvival 
        ? `${medianSurvival} months.`
        : "Not Reached";

    document.getElementById("medianSurvival").textContent = survivalMessage;
}
