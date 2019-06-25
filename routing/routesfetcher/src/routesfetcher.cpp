#include "routesfetcher.h"

float toRadians(const float degree) {
        float one_deg = (M_PI) / 180;
        return (one_deg * degree);
}
float distance(float lat1, float long1,
                         float lat2, float long2)
    {
        lat1 = toRadians(lat1);
        long1 = toRadians(long1);
        lat2 = toRadians(lat2);
        long2 = toRadians(long2);

        float dlong = long2 - long1;
        float dlat = lat2 - lat1;

        float ans = pow(sin(dlat / 2), 2) +
                          cos(lat1) * cos(lat2) *
                          pow(sin(dlong / 2), 2);

        ans = 2 * asin(sqrt(ans));

        float R = 6371;

        ans = ans * R;

        return ans;
}




