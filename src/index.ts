import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';
import express, { RequestHandler } from 'express';

// Load environment variables
dotenv.config();

const app = express();
const router = express.Router();
const port = 3000;

// Add JSON middleware
app.use(express.json());

// Initialize Linear client with API key
const linearClient = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY
});

interface QueryParams {
    assigneename?: string;
}

const getIssuesForAssignee: RequestHandler = async (req, res) => {
    try {
        const assigneeName = req.body.assigneename as string;
        
        if (!assigneeName) {
            res.status(400).json({ error: 'assigneename field is required in request body' });
            return;
        }

        // Fetch all issues
        const { nodes: allIssues } = await linearClient.issues({
            first: 100
        });

        const filteredIssues = [];
        
        // Filter issues by assignee name
        for (const issue of allIssues) {
            const assignee = await issue.assignee;
            if (assignee && assignee.name.toLowerCase() === assigneeName.toLowerCase()) {
                const state = await issue.state;
                filteredIssues.push({
                    id: issue.id,
                    title: issue.title,
                    description: issue.description,
                    status: state ? state.name : 'Unknown',
                    assignee: assignee.name,
                    createdAt: issue.createdAt
                });
            }
        }

        res.json({
            total: filteredIssues.length,
            issues: filteredIssues
        });

    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

router.post('/getIssuesForAssignee', getIssuesForAssignee);

app.use(router);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});