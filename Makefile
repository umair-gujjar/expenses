update-remote:
	ssh root@infdot.com 'cd /opt/expenses && git pull'
	ssh root@infdot.com 'supervisorctl restart expenses'

.PHONY: update-remote
