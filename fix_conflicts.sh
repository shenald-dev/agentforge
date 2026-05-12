#!/bin/bash
sed -i '/<<<<<<< HEAD/d' src/cli/CLIController.ts
sed -i '/=======/d' src/cli/CLIController.ts
sed -i '/>>>>>>> origin\/master/d' src/cli/CLIController.ts
sed -i '/<<<<<<< HEAD/d' src/integrations/LLMOptimizer.ts
sed -i '/=======/d' src/integrations/LLMOptimizer.ts
sed -i '/>>>>>>> origin\/master/d' src/integrations/LLMOptimizer.ts
