import * as shell from 'shelljs';

// Copy the database related files
shell.cp( '-R', 'database.json', 'dist/' );
shell.cp( '-R', '.env', 'dist/' );
shell.cp( '-R', 'migrations', 'dist/' );
