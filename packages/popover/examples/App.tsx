import {useState} from 'react'
import './App.scss'
import Popover from "../src";

function App() {
    const [count, setCount] = useState(0);
    return (
        <>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <div style={{height: 200, border: '1px solid red', overflow: 'auto'}}>
                <div style={{height: 300}}></div>
                <Popover content={123}>
                    <button>
                        Click me
                    </button>
                </Popover>
                <div style={{height: 600}}></div>
            </div>


            <h1>Vite + React</h1>

            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
            {/* <div style={{height: 500}}/>*/}
        </>
    )
}

export default App