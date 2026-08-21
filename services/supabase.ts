
import { createClient } from '@supabase/supabase-js';

// Configuration for specific project integration
const SUPABASE_URL = "https://pzgbzfeviabtonswaidy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Z2J6ZmV2aWFidG9uc3dhaWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2Njc0OTAsImV4cCI6MjA4MDI0MzQ5MH0.xslqnyVW07nnXOQX0cz9qzgj4jbzo-2wrDR1ATUsm08";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('[Supabase] Client initialized.');