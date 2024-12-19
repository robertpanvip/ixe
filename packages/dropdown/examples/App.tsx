import {useState} from 'react'
import './App.scss'
import Dropdown from "../src";

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
                <div style={{height: 400}}></div>
                <Dropdown items={[
                    {
                        label: '1st menu item',
                        key: 1,
                        value: '1',
                        children: [
                            {
                                label: '2st menu item',
                                key: 2,
                                value: '2'
                            }
                        ]
                    },
                    {
                        label: '3st menu item',
                        key: 3,
                        value: '3'
                    }
                ]}>
                    <button>
                        Click me
                    </button>
                </Dropdown>
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