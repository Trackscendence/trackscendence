#!/bin/sh
set -eu

read_secret() {
	var_name="$1"
	file_path="$2"
	if [ -f "$file_path" ]; then
		val="$(cat "$file_path")"
		eval "$var_name=\$val"
		export "$var_name"
	fi
}

echo

read_secret MARIADB_ROOT_PASSWORD /run/secrets/mariadb_root_password
read_secret MARIADB_PASSWORD /run/secrets/mariadb_password

SOCK="/run/mysqld/mysqld.sock"

# Change user/group ownerships of directories
chown -R mysql:mysql /run/mysqld /var/lib/mysql

# Bootstrap MariaDB if doesn't exist #######################
if [ ! -d "/var/lib/mysql/mysql" ]; then
	echo "Bootstraping MariaDB data directory..."
	mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null

# Start TEMP MariaDB Server ################################
	echo "Start temp MariaDB server for init..."
	mariadbd --user=mysql --datadir=/var/lib/mysql \
		--skip-networking --socket="$SOCK" &
	tmp_pid="$!"

	until mariadb-admin --socket="$SOCK" ping --silent; do
		sleep 1
	done

	# SQL Statement to create database and user
	echo "Creating Database and User..."
	mariadb --socket="$SOCK" -u root <<-EOSQL
		create database if not exists \`${MARIADB_DATABASE}\`;
		create user if not exists '${MARIADB_USER}'@'%' identified by '${MARIADB_PASSWORD}';
		grant all privileges on \`${MARIADB_DATABASE}\`.* to '${MARIADB_USER}'@'%';
		alter user 'root'@'localhost' identified by '${MARIADB_ROOT_PASSWORD}';
		flush privileges;
	EOSQL

	# Killing temp server
	echo "Shutting down temp MariaDB server..."
	# mariadb-admin --socket="$SOCK" shutdown
	mariadb-admin --socket="$SOCK" -uroot -p"${MARIADB_ROOT_PASSWORD}" shutdown
	wait "$tmp_pid" 2>/dev/null || true
fi


# Start Real MariaDB Server ################################
echo "Starting MariaDB..."
mariadbd --user=mysql --datadir=/var/lib/mysql \
	--bind-address=0.0.0.0 --port=3306 --socket="$SOCK" &
pid="$!"

# Waiting for Real Server ##################################
echo "The waiting [for MariaDB] is the hardest part..."
echo "That's a Tom Petty reference..."
if [ -n "${MARIADB_ROOT_PASSWORD:-}" ]; then
	until mariadb-admin --socket="$SOCK" -uroot -p"$MARIADB_ROOT_PASSWORD" ping --silent; do
		sleep 1
	done
else
	until mariadb-admin --socket="$SOCK" ping --silent; do
		sleep 1
	done
fi

# OLD: Keep mariadb(container) running for mysqld
#wait "$pid"

# Replaces the shell in-place, signals go straigt to MariaDB, no zombies
echo "Starting MariaDB as PID 1..."
exec mariadbd --user=mysql --datadir=/var/lib/mysql \
	--bind-address=0.0.0.0 --port=3306 --socket="$SOCK"

