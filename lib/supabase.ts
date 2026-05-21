import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://oglzwjtidfffqrvdqpca.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbHp3anRpZGZmZnFydmRxcGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDIwMzQsImV4cCI6MjA5NDcxODAzNH0.JRUlpQvUjXRYX8P6fOez3QoHZYtp0EFNNQHpHQtF6Jo',
  {
    global: {
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbHp3anRpZGZmZnFydmRxcGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDIwMzQsImV4cCI6MjA5NDcxODAzNH0.JRUlpQvUjXRYX8P6fOez3QoHZYtp0EFNNQHpHQtF6Jo'
      }
    }
  }
)