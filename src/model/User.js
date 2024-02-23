export default class User {
    username

    constructor(data = null) {
        this.username = ''

        if (data) {
            this.username = data.username
        }
    }

    get bggUrl() {
        return User.getBggUrl(this.username)
    }

    get bggCollectionUrl() {
        return User.getBggCollectionUrl(this.username)
    }

    static getBggUrl(username) {
        const url = `https://boardgamegeek.com/user/${username}`
        return url
    }

    static getBggCollectionUrl(username) {
        const url = `https://boardgamegeek.com/xmlapi2/collection?username=${username}&stats=1`
        return url
    }
}
