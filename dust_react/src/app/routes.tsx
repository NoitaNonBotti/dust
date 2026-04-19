import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { LostItemsPage } from "./components/LostItemsPage";
import { ReportItemPage } from "./components/ReportItemPage";
import { AdminPage } from "./components/AdminPage";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LostItemsPage },
      { path: "report", Component: ReportItemPage },
      { path: "admin", Component: AdminPage },
      { path: "*", Component: NotFound },
    ],
  },
]);