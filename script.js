/**
 * script.js
 * Frontend JavaScript for the Game Control Panel (Direct API Interaction - INSECURE)
 *
 * !!! WARNING: This version makes direct API calls from the client and is INSECURE. !!!
 * !!! Your Server-Key will be visible in browser developer tools.                !!!
 * !!! This is for illustrative purposes ONLY. Use a backend server for security.       !!!
 *
 * This version uses manual refresh buttons instead of a constant periodic update.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selections ---
    const apiKeyInput = document.getElementById('api-key-input'); // This will now be for the Server-Key
    const submitApiKeyButton = document.getElementById('submit-api-key');
    const apiSection = document.getElementById('api-section');
    const mainContent = document.getElementById('main-content');
    const apiError = document.getElementById('api-error');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    const robloxUsernameEl = document.getElementById('roblox-username'); // Note: User info is not available from these API calls
    const robloxAvatarEl = document.getElementById('roblox-avatar'); // Note: Avatar is not available from these API calls

    const logOutput = document.getElementById('log-output'); // Used for general messages/status
    const serverStatsOutput = document.getElementById('server-stats-output');
    const playerCountEl = document.getElementById('player-count');
    const queueCountEl = document.getElementById('queue-count');
    const playerListUl = document.getElementById('player-list');
    const queueListUl = document.getElementById('queue-list');
    const vehicleListUl = document.getElementById('vehicle-list'); // Added for vehicles

    // Log/Vehicle specific elements and refresh buttons
    const killLogOutput = document.getElementById('kill-log-output');
    const commandLogOutput = document.getElementById('command-log-output');
    const manualRefreshButton = document.getElementById('manual-refresh-button'); // New manual refresh button
    const tabRefreshButtons = document.querySelectorAll('.tab-content > .refresh-button'); // Buttons specific to log/vehicle tabs


    const commandInput = document.getElementById('command-input');
    const executeCommandButton = document.getElementById('execute-command-button');
    const commandResponseEl = document.getElementById('command-response');

    // --- API Configuration and State Variables ---
    const BASE_URL = 'https://api.policeroleplay.community/v1';
    let serverKey = null; // Store the Server-Key entered by the user

    // Periodic update interval is REMOVED in favor of manual refresh

    // --- Initialization ---
    submitApiKeyButton.addEventListener('click', handleServerKeySubmit);
    apiKeyInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitApiKeyButton.click();
        }
    });

    // Add event listeners for refresh buttons
    // Manual refresh button
    manualRefreshButton.addEventListener('click', fetchAllCoreData);

    // Specific tab refresh buttons (for logs/vehicles)
    tabRefreshButtons.forEach(button => {
        button.addEventListener('click', handleTabRefreshClick);
    });


    // --- Core Functions ---

    /**
     * Handles the submission of the Server-Key.
     */
    function handleServerKeySubmit() {
        const key = apiKeyInput.value.trim();
        if (!key) {
            apiError.textContent = 'Server-Key cannot be empty.';
            return;
        }
        // !!! SECURITY RISK: Server-Key is now stored in a client-side variable !!!
        serverKey = key;
        apiError.textContent = '';
        apiSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        initializePanel();
    }

    /**
     * Initializes the main panel after Server-Key submission.
     * Sets up UI elements and performs initial data fetch.
     */
    function initializePanel() {
        console.log("Initializing panel with provided Server-Key (client-side only).");
         appendLog('[INFO] Panel initialized. Use the "Refresh" buttons to get data.');

        // Display placeholder user data
        displayRobloxUserData();

        // Setup UI elements
        setupTabs();
        setupCommandExecution();

        // *** REMOVED: startPeriodicUpdates() ***
        // Data is now fetched manually or on tab click

        // Fetch initial data for the default active tab if needed,
        // but core data is now fetched via the manual button click (or implicitly on page load if that button is clicked)
        // Let's perform an initial fetch of all core data on panel load
        fetchAllCoreData(); // Fetch initial data immediately on panel load
    }

    /**
     * Displays placeholder Roblox username and avatar (API doesn't provide this info).
     */
    function displayRobloxUserData() {
         robloxUsernameEl.textContent = "Server Admin"; // Placeholder username
         robloxAvatarEl.src = 'placeholder-avatar.png'; // Placeholder avatar
         robloxAvatarEl.alt = 'User Avatar';
         console.warn("User info (username/avatar) is not available directly from these API endpoints.");
    }


    /**
     * Fetches all core data (stats, players, queue, vehicles).
     * Called by the manual refresh button and on initial panel load.
     */
    async function fetchAllCoreData() {
         appendLog('[INFO] Refreshing core server data...');
         // Fetch these core data points when the manual refresh button is clicked
         fetchServerStatus();
         fetchPlayers();
         fetchQueue();
         fetchVehicles();
    }

    /**
     * Handles clicks on refresh buttons specific to tabs (logs, vehicles).
     * @param {Event} event - The click event.
     */
    function handleTabRefreshClick(event) {
        const logType = event.target.dataset.logType;
         appendLog(`[INFO] Refreshing ${logType || 'data'}...`);
        if (logType === 'killlogs') {
            fetchKillLogs();
        } else if (logType === 'commandlogs') {
            fetchCommandLogs();
        } else if (logType === 'vehicles') {
             fetchVehicles(); // Allow refreshing vehicles via its tab button too
        }
    }


    /**
     * Makes a GET request to a PRC API endpoint.
     * @param {string} endpoint - The API endpoint (e.g., '/server').
     * @returns {Promise<object|null>} The JSON response data or null if an error occurred.
     */
    async function fetchFromApi(endpoint) {
        if (!serverKey) {
            console.error("Server-Key is not set.");
             apiError.textContent = 'Server-Key is missing. Please re-enter.';
             mainContent.classList.add('hidden');
             apiSection.classList.remove('hidden');
            // No periodic interval to clear here anymore
            return null;
        }

        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Accept': 'application/json',
            'Server-Key': serverKey // !!! SECURITY RISK: Server-Key exposed here !!!
            // 'Authorization': `Bearer ${YOUR_GLOBAL_API_KEY_IF_USED}` // If you have a global key
        };

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                 if (response.status === 403) {
                      console.error(`API Forbidden: Invalid Server-Key? Status: ${response.status}`);
                       appendLog('[ERROR] API Rejected (403 Forbidden). Is the Server-Key correct?');
                       apiError.textContent = 'API access denied. Check Server-Key.';
                       mainContent.classList.add('hidden');
                       apiSection.classList.remove('hidden');
                       // No periodic interval to clear here anymore
                 } else {
                    console.error(`HTTP error! status: ${response.status} for ${endpoint}`);
                     appendLog(`[ERROR] HTTP error fetching ${endpoint}: ${response.status}`);
                 }

                const errorText = await response.text();
                 console.error('Error response body:', errorText);
                return null;
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            appendLog(`[ERROR] Network error fetching ${endpoint}: ${error.message}`);
            return null;
        }
    }

    /**
     * Fetches and updates server status.
     */
    async function fetchServerStatus() {
        const stats = await fetchFromApi('/server');
        if (stats) {
            updateServerStats(stats);
        } else {
             updateServerStats({});
        }
    }

    /**
     * Fetches and updates the player list.
     */
    async function fetchPlayers() {
        const players = await fetchFromApi('/server/players');
        if (players) {
             updatePlayerData({ online: players, onlineCount: players.length });
        } else {
             updatePlayerData({ online: [], onlineCount: 0 });
        }
    }

    /**
     * Fetches and updates the queue list.
     */
     async function fetchQueue() {
        const queue = await fetchFromApi('/server/queue');
        if (queue && Array.isArray(queue)) {
             const queueNamesOrIds = queue.map(id => `Player ID: ${id}`); // Display IDs for now
             updatePlayerData({ queue: queueNamesOrIds, queueCount: queue.length });
        } else {
             updatePlayerData({ queue: [], queueCount: 0 });
        }
     }

     /**
      * Fetches and updates the vehicle list.
      * Called by fetchAllCoreData and the Vehicles tab refresh button.
      */
     async function fetchVehicles() {
          const vehicles = await fetchFromApi('/server/vehicles');
          if (vehicles && Array.isArray(vehicles)) {
              updateVehicleList(vehicles);
          } else {
              updateVehicleList([]);
          }
     }

     /**
      * Fetches and displays kill logs.
      * Called by the Kill Logs tab click and its refresh button.
      */
     async function fetchKillLogs() {
          killLogOutput.textContent = 'Fetching kill logs...';
          const killLogs = await fetchFromApi('/server/killlogs');
          if (killLogs && Array.isArray(killLogs)) {
              updateKillLogs(killLogs);
          } else {
              killLogOutput.textContent = 'Failed to fetch kill logs or none available.';
              console.warn("Failed to fetch or received empty kill logs.");
          }
     }

     /**
      * Fetches and displays command logs.
      * Called by the Command Logs tab click and its refresh button.
      */
     async function fetchCommandLogs() {
         commandLogOutput.textContent = 'Fetching command logs...';
         const commandLogs = await fetchFromApi('/server/commandlogs');
         if (commandLogs && Array.isArray(commandLogs)) {
             updateCommandLogs(commandLogs);
         } else {
             commandLogOutput.textContent = 'Failed to fetch command logs or none available.';
             console.warn("Failed to fetch or received empty command logs.");
         }
     }


    /**
     * Sets up the event listeners for tab switching.
     * Triggers specific fetches when certain tabs are activated.
     */
    function setupTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTabId = button.getAttribute('data-tab');
                const targetTabContent = document.getElementById(targetTabId);

                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                if (targetTabContent) {
                    targetTabContent.classList.add('active');
                }

                // --- Fetch data specific to the tab when activated ---
                if (targetTabId === 'killlogs') {
                    fetchKillLogs();
                } else if (targetTabId === 'commandlogs') {
                    fetchCommandLogs();
                } else if (targetTabId === 'vehicles') {
                    fetchVehicles(); // Also refresh vehicles on tab click
                }
                // Stats, Players, Queue are now fetched by manualRefreshButton and initial load
            });
        });
        // Trigger click on the default active tab button
         const defaultTabButton = document.querySelector('.tab-button.active');
         if (defaultTabButton) {
             defaultTabButton.click();
         } else if (tabButtons.length > 0) {
             tabButtons[0].click();
         }
    }

    /**
     * Sets up event listeners for the command input field and execute button.
     */
    function setupCommandExecution() {
        executeCommandButton.addEventListener('click', handleSendCommand);
        commandInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSendCommand();
            }
        });
    }

    /**
     * Handles sending a command.
     */
    async function handleSendCommand() {
        const command = commandInput.value.trim();
        if (!command) {
            displayCommandResponse('Command cannot be empty.');
            return;
        }

        if (!serverKey) {
             displayCommandResponse('Cannot send command: Server-Key missing.');
             return;
        }

        const url = `${BASE_URL}/server/command`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Server-Key': serverKey // !!! SECURITY RISK: Server-Key exposed here !!!
        };
        const body = JSON.stringify({ command: command });

        commandResponseEl.textContent = 'Sending command...';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            });

            if (response.status === 200) {
                displayCommandResponse('Command executed successfully.');
                appendLog(`[COMMAND Sent] "${command}"`);
            } else {
                console.error(`Command execution failed! Status: ${response.status}`);
                 const errorText = await response.text();
                 console.error('Error response body:', errorText);
                let errorMessage = `Command failed (Status: ${response.status}).`;
                if (errorText) errorMessage += ` Details: ${errorText}`;
                displayCommandResponse(errorMessage);
                appendLog(`[COMMAND Send Error] "${command}" failed: Status ${response.status}`);
            }

        } catch (error) {
            console.error('Network error sending command:', error);
            displayCommandResponse(`Network error sending command: ${error.message}`);
            appendLog(`[COMMAND Send Error] Network error "${command}": ${error.message}`);
        }

        commandInput.value = '';
    }


    // --- UI Update Functions ---
    // These remain the same, receiving data from fetch calls

    function appendLog(message) {
        const timestamp = `[${new Date().toLocaleTimeString()}] `;
        const logEntry = document.createElement('div');
        logEntry.textContent = `${timestamp}${message}`;
        logOutput.appendChild(logEntry);
        logOutput.scrollTop = logOutput.scrollHeight;
    }

    function updateServerStats(stats) {
        let statsHtml = '<p>No current stats data available.</p>';
        if (stats && typeof stats === 'object' && Object.keys(stats).length > 0) {
            statsHtml = '';
            if (stats.Name !== undefined) statsHtml += `<p><strong>Server Name:</strong> ${stats.Name}</p>`;
            if (stats.CurrentPlayers !== undefined) statsHtml += `<p><strong>Current Players:</strong> ${stats.CurrentPlayers}</p>`;
            if (stats.MaxPlayers !== undefined) statsHtml += `<p><strong>Max Players:</strong> ${stats.MaxPlayers}</p>`;
            if (stats.JoinKey !== undefined) statsHtml += `<p><strong>Join Key:</strong> ${stats.JoinKey}</p>`;
            if (stats.AccVerifiedReq !== undefined) statsHtml += `<p><strong>Account Verification Required:</strong> ${stats.AccVerifiedReq}</p>`;
            if (stats.TeamBalance !== undefined) statsHtml += `<p><strong>Team Balance Enabled:</strong> ${stats.TeamBalance}</p>`;
        } else if (stats === null) {
             statsHtml = '<p>Failed to fetch server stats.</p>';
        }
        serverStatsOutput.innerHTML = statsHtml;
    }

    function updatePlayerData(playerData) {
        const onlinePlayers = Array.isArray(playerData?.online) ? playerData.online : [];
        const queuePlayers = Array.isArray(playerData?.queue) ? playerData.queue : [];

        playerCountEl.textContent = onlinePlayers.length;
        queueCountEl.textContent = queuePlayers.length;

        playerListUl.innerHTML = '';
        if (onlinePlayers.length > 0) {
             onlinePlayers.forEach(player => {
                 if (player && player.Player) {
                      const li = document.createElement('li');
                       const playerNameId = player.Player;
                       const parts = playerNameId.split(':');
                       const name = parts[0] || 'Unknown Player';
                       const id = parts[1] ? ` (ID: ${parts[1]})` : '';

                       let playerInfo = `<strong>${name}</strong>${id}`;
                       if (player.Permission && player.Permission !== 'Normal') playerInfo += ` [${player.Permission}]`;
                       if (player.Team) playerInfo += ` (${player.Team})`;
                       if (player.Callsign) playerInfo += ` - Callsign: ${player.Callsign}`;

                       li.innerHTML = playerInfo;
                       playerListUl.appendChild(li);
                 }
             });
        } else {
            playerListUl.innerHTML = '<li>No players currently online.</li>';
        }

        queueListUl.innerHTML = '';
        if (queuePlayers.length > 0) {
             queuePlayers.forEach(playerInfo => {
                 if (playerInfo) {
                     const li = document.createElement('li');
                     li.textContent = playerInfo;
                     queueListUl.appendChild(li);
                 }
             });
        } else {
            queueListUl.innerHTML = '<li>Queue is currently empty.</li>';
        }
    }

     function updateVehicleList(vehicles) {
         vehicleListUl.innerHTML = '';
         if (Array.isArray(vehicles) && vehicles.length > 0) {
             vehicles.forEach(vehicle => {
                 if (vehicle && vehicle.Name) {
                      const li = document.createElement('li');
                      let vehicleInfo = `<strong>${vehicle.Name}</strong>`;
                      if (vehicle.Texture) vehicleInfo += ` (Texture: ${vehicle.Texture})`;
                      if (vehicle.Owner) vehicleInfo += ` - Owner: ${vehicle.Owner}`;

                      li.innerHTML = vehicleInfo;
                      vehicleListUl.appendChild(li);
                 }
             });
         } else {
             vehicleListUl.innerHTML = '<li>No vehicles currently spawned.</li>';
         }
     }

     function updateKillLogs(logs) {
         killLogOutput.innerHTML = '';
         if (Array.isArray(logs) && logs.length > 0) {
              logs.sort((a, b) => b.Timestamp - a.Timestamp);
              logs.forEach(log => {
                   if (log.Killed && log.Timestamp) {
                        const timestamp = new Date(log.Timestamp * 1000).toLocaleString();
                        const killer = log.Killer || 'Unknown/Environment';
                        const killedParts = log.Killed.split(':');
                        const killedName = killedParts[0] || 'Unknown Player';
                        const killerParts = killer.split(':');
                        const killerName = killerParts[0] || killer;

                        const logEntry = document.createElement('div');
                        logEntry.textContent = `[${timestamp}] ${killedName} was killed by ${killerName}.`;
                        killLogOutput.appendChild(logEntry);
                   }
              });
               killLogOutput.scrollTop = 0;
         } else {
             killLogOutput.textContent = 'No kill logs available.';
         }
     }

     function updateCommandLogs(logs) {
         commandLogOutput.innerHTML = '';
         if (Array.isArray(logs) && logs.length > 0) {
             logs.sort((a, b) => b.Timestamp - a.Timestamp);
             logs.forEach(log => {
                 if (log.Player && log.Timestamp && log.Command) {
                      const timestamp = new Date(log.Timestamp * 1000).toLocaleString();
                      const playerParts = log.Player.split(':');
                      const playerName = playerParts[0] || 'Unknown Player';

                      const logEntry = document.createElement('div');
                      logEntry.textContent = `[${timestamp}] ${playerName} executed command: "${log.Command}"`;
                      commandLogOutput.appendChild(logEntry);
                 }
             });
             commandLogOutput.scrollTop = 0;
         } else {
             commandLogOutput.textContent = 'No command logs available.';
         }
     }

    function displayCommandResponse(response) {
        commandResponseEl.textContent = response;
        // Optional: Clear the response message after a few seconds
        // setTimeout(() => {
        //     if (commandResponseEl.textContent === response) {
        //          commandResponseEl.textContent = '';
        //      }
        // }, 7000);
    }

}); // End DOMContentLoaded Listener