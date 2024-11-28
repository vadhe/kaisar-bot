import { logger, HttpsProxyAgent, axios } from './exporter.js';

function createApiClient(token) {
    // const agent = new HttpsProxyAgent(proxy);
    return axios.create({
        baseURL: 'https://zero-api.kaisar.io/',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        // agent,
    });
}
async function fetchMissionTasks(extensionId, token) {
    const apiClient = createApiClient(token); 

    try {
        const response = await apiClient.get('mission/tasks');
        const tasks = response.data.data; 
        const activeTaskIds = tasks
            .filter(task => task.status === 1)  
            .map(task => task._id);            

        if (activeTaskIds.length > 0) {
            logger(`[${extensionId}] Task Complete Found with IDs: ${activeTaskIds}`, 'warn');
        }

        return activeTaskIds;
    } catch (error) {
        logger(`[${extensionId}] Error fetching mission tasks`, 'error');
        return null;
    }
}
let payload = {referrer: "EoKtoJ377"}
async function claimMissionTasks(extensionId, token, taskIds) {
    const apiClient = createApiClient(token); 

    for (let taskId of taskIds) {
        try {
            const response = await apiClient.post(`mission/tasks/${taskId}/claim`, {});
            const task = response.data.data; 
            logger(`[${extensionId}] Claim Rewards From Task ID: ${taskId} ${task}`, 'success');
        } catch (error) {
            logger(`[${extensionId}] Error claiming task with ID ${taskId}`, 'error');
        }
    }
}
export { payload as headers }
export async function dailyCheckin(extensionId, token) {
    const apiClient = createApiClient(token); 

    try {
        const response = await apiClient.post('checkin/check', {});
        const checkin = response.data.data; 
        if (checkin) { 
            logger(`[${extensionId}] Daily Checkin Successful ${checkin.time}`, 'success');
        }
    } catch (error) {
        logger(`[${extensionId}] Error when check-in: Already checked in today...`, 'error');
    }
}
export async function checkAndClaimTask(extensionId, token) {
    const taskIds = await fetchMissionTasks(extensionId, token);
    if (taskIds && taskIds.length > 0) {
        await claimMissionTasks(extensionId, token, taskIds);
    } else {
        logger(`[${extensionId}] No tasks that can be claimed found...`);
    }
}
