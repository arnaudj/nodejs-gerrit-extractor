/* @flow */
import GerritChangesData from './GerritChangesData';
import UserStats from './UserStats';

class GerritUsersStatsBuilder {
    users: Map<string, UserStats>;

    constructor() {
        this.users = new Map();
    }

    build(gdata: GerritChangesData) {
        const getOrCreateUser = (users:any, username:any) => {
            if (!users.has(username)) {
                users.set(username, new UserStats(username));
            }
            return users.get(username);
        };

        // Scan events (comments)
        gdata.getEvents().forEach((e) => {
            getOrCreateUser(this.users, e.username).acceptEvent(e);
        });

        // Scan changesets
        gdata.getChangesets().forEach((c) => {
            getOrCreateUser(this.users, c.owner).acceptChangeset(c);
        });
    }

    getUsers() { return this.users; }
}

export default GerritUsersStatsBuilder;