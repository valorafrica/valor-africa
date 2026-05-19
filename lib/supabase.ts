import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oglzwjtidfffqrvdqpca.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbHp3anRpZGZmZnFydmRxcGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDIwMzQsImV4cCI6MjA5NDcxODAzNH0.JRUlpQvUjXRYX8P6fOez3QoHZYtp0EFNNQHpHQtF6Jo'

export const supabase = createClient(supabaseUrl, supabaseKey)