export interface IFollowService {
    getBusinessFollowerCount(businessId: string): Promise<number>;

    followBusiness(userId: string, businessId: string): Promise<any>;

    unfollowBusiness(userId: string, businessId: string): Promise<any>;

    getFollowedBusinesses(userId: string): Promise<any>;

    getBusinessFollowers(businessId: string): Promise<any>;

    isFollowing(userId: string, businessId: string): Promise<boolean>

    getFollowingCountByBusinessAndIsFollowingUser(userId: string, businessId: string): Promise<{
        isFollowing: boolean,
        count: number
    }>
}