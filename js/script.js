// Drag & Drop Task Manager JavaScript

// Global variables
let taskIdCounter = 0;
const taskData = {
    todo: [],
    inprogress: [],
    done: []
};

// DOM elements
const taskInput = document.getElementById('taskInput');
const taskPriority = document.getElementById('taskPriority');
const addTaskBtn = document.getElementById('addTaskBtn');
const columns = document.querySelectorAll('.task-column');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load tasks from localStorage if available
    loadTasks();
    
    // Add event listener for the Add Task button
    addTaskBtn.addEventListener('click', createNewTask);
    
    // Add event listener for Enter key in task input
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createNewTask();
        }
    });

    addSearchFunctionality();
    updateTaskCounters();
    updateProgressBar();
});

// Drag and Drop Functions
function allowDrop(event) {
    event.preventDefault();
    // Add visual feedback for drop target
    event.currentTarget.classList.add('drag-over');
}

function dragLeave(event) {
    // Remove visual feedback when dragging leaves the drop target
    event.currentTarget.classList.remove('drag-over');
}

function drag(event) {
    // Store the dragged element's ID in the dataTransfer object
    event.dataTransfer.setData('text/plain', event.target.id);
    // Add dragging class for visual feedback
    event.target.classList.add('dragging');
}

function drop(event) {
    event.preventDefault();
    
    // Remove drag-over class from all columns
    document.querySelectorAll('.task-column').forEach(column => {
        column.classList.remove('drag-over');
    });
    
    // Get the dragged element's ID from the dataTransfer object
    const taskId = event.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);
    
    // If the task element exists
    if (taskElement) {
        // Remove dragging class
        taskElement.classList.remove('dragging');
        
        // Get source and target columns
        const sourceColumn = taskElement.parentElement.dataset.column;
        const targetColumn = event.currentTarget.dataset.column;
        
        // Only proceed if the target is different from the source
        if (sourceColumn !== targetColumn) {
            // Move the task element to the target column
            event.currentTarget.appendChild(taskElement);
            
            // Update the task data
            updateTaskData(taskId, sourceColumn, targetColumn);
            
            // Save tasks to localStorage
            saveTasks();
        } else {
            // If dropping in the same column, just append to maintain order
            event.currentTarget.appendChild(taskElement);
        }
    }

    updateTaskCounters();
    updateProgressBar();
}

// Task Management Functions
function createNewTask() {
    const taskText = taskInput.value.trim();
    const priority = taskPriority.value;
    
    if (taskText === '') {
        // Highlight the input field if empty
        taskInput.classList.add('border-red-500');
        taskInput.classList.add('focus:ring-red-500');
        setTimeout(() => {
            taskInput.classList.remove('border-red-500');
            taskInput.classList.remove('focus:ring-red-500');
        }, 2000);
        return;
    }
    
    // Create a new task with unique ID
    const taskId = 'task-' + taskIdCounter++;
    
    // Create the task element
    const taskElement = createTaskElement(taskId, taskText, priority);
    
    // Add the task to the "To Do" column by default
    document.getElementById('todo-column').appendChild(taskElement);
    
    // Add the task data to the taskData object
    taskData.todo.push({
        id: taskId,
        text: taskText,
        priority: priority
    });
    
    // Save tasks to localStorage
    saveTasks();
    
    // Clear the input field
    taskInput.value = '';
    
    // Add animation class
    taskElement.classList.add('new-task');
    setTimeout(() => {
        taskElement.classList.remove('new-task');
    }, 500);

    updateTaskCounters();
    updateProgressBar();
}

function createTaskElement(id, text, priority) {
    // Create the task card element
    const taskElement = document.createElement('div');
    taskElement.id = id;
    taskElement.className = `task-card priority-${priority}`;
    taskElement.draggable = true;
    
    // Add drag event listeners
    taskElement.addEventListener('dragstart', drag);
    
    // Create the task content
    taskElement.innerHTML = `
        <div class="task-content">${text}</div>
        <div class="priority-badge">${getPriorityLabel(priority)}</div>
        <div class="task-actions">
            <button class="action-button delete-btn" onclick="deleteTask('${id}')">Delete</button>
        </div>
    `;
    
    return taskElement;
}

function getPriorityLabel(priority) {
    switch(priority) {
        case 'low':
            return 'Low Priority';
        case 'medium':
            return 'Medium Priority';
        case 'high':
            return 'High Priority';
        default:
            return 'Medium Priority';
    }
}

function deleteTask(taskId) {
    const taskElement = document.getElementById(taskId);
    if (taskElement) {
        // Get the column the task is in
        const column = taskElement.parentElement.dataset.column;
        
        // Remove the task from the DOM
        taskElement.remove();
        
        // Remove the task from the taskData object
        taskData[column] = taskData[column].filter(task => task.id !== taskId);
        
        // Save tasks to localStorage
        saveTasks();
    }

    updateTaskCounters();
    updateProgressBar();
}

function updateTaskData(taskId, sourceColumn, targetColumn) {
    // Find the task in the source column
    const taskIndex = taskData[sourceColumn].findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        // Remove the task from the source column
        const task = taskData[sourceColumn].splice(taskIndex, 1)[0];
        
        // Add the task to the target column
        taskData[targetColumn].push(task);
    }
}

// LocalStorage Functions
function saveTasks() {
    localStorage.setItem('taskManagerData', JSON.stringify(taskData));
}

function loadTasks() {
    const savedData = localStorage.getItem('taskManagerData');
    
    if (savedData) {
        // Parse the saved data
        const parsedData = JSON.parse(savedData);
        
        // Update the taskData object
        Object.assign(taskData, parsedData);
        
        // Determine the highest task ID to continue from
        let maxId = 0;
        
        // Render tasks for each column
        for (const column in taskData) {
            const columnElement = document.getElementById(`${column}-column`);
            
            taskData[column].forEach(task => {
                // Extract the numeric part of the task ID
                const idNumber = parseInt(task.id.split('-')[1]);
                maxId = Math.max(maxId, idNumber);
                
                // Create and append the task element
                const taskElement = createTaskElement(task.id, task.text, task.priority);
                columnElement.appendChild(taskElement);
            });
        }
        
        // Set the task counter to continue from the highest ID
        taskIdCounter = maxId + 1;
    }
}

// Add task counter to column headers
function updateTaskCounters() {
    ['todo', 'inprogress', 'done'].forEach(column => {
        const count = taskData[column].length;
        const header = document.querySelector(`#${column}-column`).previousElementSibling;
        const counter = header.querySelector('.task-counter') || document.createElement('span');
        counter.className = 'task-counter ml-2 bg-gray-200 px-2 py-1 rounded-full text-sm';
        counter.textContent = count;
        if (!header.querySelector('.task-counter')) {
            header.appendChild(counter);
        }
    });
}

// Add progress indicator
function updateProgressBar() {
    const total = Object.values(taskData).flat().length;
    const done = taskData.done.length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    
    let progressBar = document.getElementById('progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.className = 'w-full bg-gray-200 rounded-full h-2 mb-8';
        progressBar.innerHTML = `<div class="progress-fill h-full rounded-full transition-all duration-500 ease-out"></div>`;
        document.querySelector('.container').insertBefore(progressBar, document.querySelector('.grid'));
    }
    
    const fill = progressBar.querySelector('.progress-fill');
    fill.style.width = `${progress}%`;
    fill.className = `progress-fill h-full rounded-full transition-all duration-500 ease-out ${
        progress < 30 ? 'bg-red-500' : progress < 70 ? 'bg-yellow-500' : 'bg-green-500'
    }`;
}

// Make functions available globally
window.allowDrop = allowDrop;
window.dragLeave = dragLeave;
window.drag = drag;
window.drop = drop;
window.deleteTask = deleteTask;

// Add task search functionality
function addSearchFunctionality() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search tasks...';
    searchInput.className = 'w-full md:w-64 p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    document.querySelector('.container').insertBefore(searchInput, document.querySelector('.grid'));
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.task-card').forEach(card => {
            const text = card.querySelector('.task-content').textContent.toLowerCase();
            card.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });
}
