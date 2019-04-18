#include "routesfetcher.h"

double toRadians(const double degree) {
        double one_deg = (M_PI) / 180;
        return (one_deg * degree);
}
double distance(double lat1, double long1,
                         double lat2, double long2)
    {
        lat1 = toRadians(lat1);
        long1 = toRadians(long1);
        lat2 = toRadians(lat2);
        long2 = toRadians(long2);

        double dlong = long2 - long1;
        double dlat = lat2 - lat1;

        double ans = pow(sin(dlat / 2), 2) +
                          cos(lat1) * cos(lat2) *
                          pow(sin(dlong / 2), 2);

        ans = 2 * asin(sqrt(ans));

        double R = 6371;

        ans = ans * R;

        return ans;
}




