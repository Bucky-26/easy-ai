import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
const app = express();
const port = 3001;
app.use((req, res, next) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  // Allow access if the x-forwarded-for header is present
  if (forwardedFor) {
    next();
  } else {
    // Block direct IP access
    res.status(403).json({ error: 'Forbidden - Direct IP access is not allowed' });
  }
});

app.use(express.json());

app.use(express.json());
const whitelisted = ['https://newtai.bgfxd.repl.co', 'https://myfile.amigohaycyril.repl.co'];
app.get('/api/:model', async (req, res) => {
	try {
		const m = req.params.model;
		const query = req.query.query;
		if (!query) {
			res.json({ error: "Invalid Request - Blank field(query)" });
			return false;
		}

		if (m == "mistral") {
			var model = "mistralai/mistral-7b-instruct";

		}  else if (m == "zephyr") {
			var model = "huggingfaceh4/zephyr-7b-beta";
		} else if (m == "mythomist") {
			var model = "gryphe/mythomist-7b";

		} else if (m == "nous-capybara-7b") {
			var model = "nousresearch/nous-capybara-7b";


		} else if (m == "openchat") {
			var model = "openchat/openchat-7b";

		} else if (m == "cinematika") {
			var model = "openrouter/cinematika-7b";

		}
		else {
			res.json({ error: "Invalid AI  Model" })
			return false;
		}
		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer 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`,
				"HTTP-Referer": 'https://ai.ea-sy.tech/',
				"X-Title": 'EASY API',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: "system", content: "You are a helpful assistant, note: only answer using English if the  dont ask you the response in other language" },
					{ role: "user", content: query },
				],
			}),
		});

		const result = await response.json();
		const content = result.choices[0].message.content;
		res.json({
			status: 200,
			maintain_by: "ISOY DEV",
			content: content
		});
	} catch (error) {
		res.status(500).json({ error: 'An error occurred.' });
		console.error(error);
	}
});
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));


app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
