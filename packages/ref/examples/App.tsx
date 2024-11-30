import {useRef, useState} from 'react'
import './App.scss'
import Ref from "../src";

function App() {
    const [count, setCount] = useState(0);
    const ref = useRef<Element>(null)
    return (
        <>
            <Ref ref={ref}>
                <div className="card">
                    <button onClick={() => setCount((count) => count + 1)}>
                        count is {count}
                    </button>
                    <p>
                        Edit <code>src/App.tsx</code> and save to test HMR
                    </p>
                </div>
            </Ref>
            <h1>Vite + React</h1>

            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    )
}

export default App