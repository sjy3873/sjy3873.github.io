document.addEventListener("DOMContentLoaded", function() {
    const fundSelect = document.getElementById('fundSelect');
    const monthlyInput = document.getElementById('monthlyContribution');
    const resultsContainer = document.getElementById('results-container');
    
    let growthChart;
    let fundData = [];

    const formatter = new Intl.NumberFormat('en-US', { 
        style: 'currency', currency: 'USD', maximumFractionDigits: 0 
    });

    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error("Network error");
            return response.json();
        })
        .then(data => {
            fundData = data;
            populateDropdown();
            calculateAndDraw();
        })
        .catch(error => {
            console.error('Error fetching JSON:', error);
            fundSelect.innerHTML = '<option value="">Error loading data</option>';
            resultsContainer.innerHTML = '<p style="color:red; font-size:0.8rem;">Note: App logic will run correctly once uploaded to GitHub Pages.</p>';
        });

    function populateDropdown() {
        fundSelect.innerHTML = '';
        fundData.forEach((fund, index) => {
            let option = document.createElement('option');
            option.value = index;
            option.text = `${fund.name} (~${(fund.rate * 100).toFixed(1)}% avg)`;
            fundSelect.appendChild(option);
        });
    }

    function calculateAndDraw() {
        if (fundData.length === 0) return;

        const selectedFund = fundData[fundSelect.value];
        const r = selectedFund.rate / 12; 
        const p = parseFloat(monthlyInput.value) || 0; 
        
        const milestoneYears = [10, 20, 30, 40];
        const chartLabels = [];
        const portfolioData = [];
        const principalData = [];
        
        resultsContainer.innerHTML = '';

        for (let y = 0; y <= 40; y++) {
            const n = y * 12; 
            const principal = p * n;
            const futureValue = p * (((Math.pow(1 + r, n)) - 1) / r);
            const interestEarned = futureValue - principal;
            
            chartLabels.push(`Year ${y}`);
            portfolioData.push(futureValue);
            principalData.push(principal);

            if (milestoneYears.includes(y)) {
                resultsContainer.innerHTML += `
                    <div class="result-row">
                        <div class="res-year">${y} Yrs</div>
                        <div class="res-breakdown">
                            Principal: ${formatter.format(principal)}<br>
                            Interest: ${formatter.format(interestEarned)}
                        </div>
                        <div class="res-total">${formatter.format(futureValue)}</div>
                    </div>
                `;
            }
        }

        const ctx = document.getElementById('growthChart').getContext('2d');
        if (growthChart) growthChart.destroy();

        growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Total Portfolio Value',
                        data: portfolioData,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0
                    },
                    {
                        label: 'Total Contributed (Principal)',
                        data: principalData,
                        borderColor: '#4DA8DA',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { labels: { color: '#F0F0F0' } } },
                scales: {
                    y: { ticks: { color: '#A6A6A6', callback: function(value) { return '$' + (value/1000) + 'k'; } }, grid: { color: '#333333' } },
                    x: { ticks: { color: '#A6A6A6', maxTicksLimit: 8 }, grid: { color: '#333333' } }
                }
            }
        });
    }

    fundSelect.addEventListener('change', calculateAndDraw);
    monthlyInput.addEventListener('input', calculateAndDraw);
});