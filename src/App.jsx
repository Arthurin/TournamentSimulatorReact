import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { V2 } from "./pages/V2";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter basename="/TournamentSimulatorReact">
      <Routes>
        <Route index element={<Home />} />
        <Route path="v2" element={<V2 />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
