import {useState} from 'react'
import './App.scss'
import Button from "../src";

function App() {
    const [count, setCount] = useState(0);
    return (
        <>
            <div className="card">
                <Button variant='solid' loading onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </Button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <h1>Vite + React</h1>

            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    )
}

export default App