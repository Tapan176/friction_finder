import { Router, type IRouter } from "express";
import healthRouter from "./health";
import repositoriesRouter from "./repositories";
import scansRouter from "./scans";
import metricsRouter from "./metrics";
import insightsRouter from "./insights";
import beforeAfterRouter from "./before-after";

const router: IRouter = Router();

router.use(healthRouter);
router.use(repositoriesRouter);
router.use(scansRouter);
router.use(metricsRouter);
router.use(insightsRouter);
router.use(beforeAfterRouter);

export default router;
