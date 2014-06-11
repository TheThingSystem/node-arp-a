#include <v8.h>
#include <node.h>

#include <stdlib.h>

#include <sys/types.h>
#include <sys/sysctl.h>

#include <net/if.h>
#include <net/route.h>
#include <netinet/if_ether.h>
#include <net/if_dl.h>

#include <ifaddrs.h>
#include <arpa/inet.h>


using namespace v8;
using namespace node;


Handle<Value> ArpTable(const Arguments& args) {
  HandleScope       scope;

  int     mib[] = { CTL_NET, PF_ROUTE, 0, AF_INET, NET_RT_FLAGS, RTF_LLINFO, 0 };
  size_t  len = 0;
  char   *head, *ptr, *tail;

// step 1: fetch the arp table

  if (sysctl(mib, (sizeof mib / sizeof mib[0]) - 1, NULL, &len, NULL, 0) < 0)
    return ThrowException(Exception::Error(String::New("sysctl failed to get length for ARP table.")));

  if ((head = ((char *) malloc(len))) == NULL)
    return ThrowException(Exception::Error(String::New("malloc failed to allocate return buffer for ARP table.")));

  if (sysctl(mib, (sizeof mib / sizeof mib[0]) - 1, head, &len, NULL, 0) < 0)
    return ThrowException(Exception::Error(String::New("sysctl failed to retrieve ARP table.")));
  tail = head + len;


// step 2: count the number of entries and make an array

  int    i = 0;
  struct rt_msghdr *rtm;

  for (ptr = head; ptr < tail; ptr += rtm->rtm_msglen) {
    rtm = (struct rt_msghdr *) ptr;

    struct sockaddr_inarp *sin = (struct sockaddr_inarp *) (rtm + 1);
    struct sockaddr_dl    *sdl = (struct sockaddr_dl *) (sin + 1);

    if (sdl->sdl_alen > 0) i++;
  }

  Local<Array> entries = Array::New(i);


// step 3: fill-in the array

  i = 0;
  struct if_nameindex *ifp = if_nameindex();
  for (ptr = head; ptr < tail; ptr += rtm->rtm_msglen) {
    rtm = (struct rt_msghdr *) ptr;

    struct sockaddr_inarp *sin = (struct sockaddr_inarp *) (rtm + 1);
    struct sockaddr_dl    *sdl = (struct sockaddr_dl *) (sin + 1);

    char    lladdr[(6 * 3) + 1];
    u_char *ll = (u_char *) LLADDR(sdl);
    if (sdl->sdl_alen == 0) continue;

    struct if_nameindex *ifx = NULL;
    if (ifp) {
      for (ifx = ifp; (ifx -> if_index != 0) && (ifx -> if_name != NULL); ifx++) if (ifx->if_index == rtm-> rtm_index) break;
    }
    snprintf(lladdr, sizeof lladdr, "%02x:%02x:%02x:%02x:%02x:%02x", ll[0], ll[1], ll[2], ll[3], ll[4], ll[5]);

    Local<Object> entry = Object::New();
    entry->Set(NODE_PSYMBOL("ip"), String::New(inet_ntoa(sin->sin_addr)));
    entry->Set(NODE_PSYMBOL("ifname"), String::New(ifx ? ifx -> if_name : ""));
    entry->Set(NODE_PSYMBOL("mac"), String::New(lladdr));
    entries->Set(i++, entry);
  }

  if_freenameindex(ifp);
  free (head);

  return scope.Close(entries);
}


Handle<Value> IfTable(const Arguments& args) {
  HandleScope         scope;

  int                 i;
  struct ifaddrs     *ifa, *ifp;
  struct sockaddr_dl *sdl;

  if (getifaddrs(&ifp) < 0) return ThrowException(Exception::Error(String::New("getifaddrs failed.")));

  i = 0;
  for (ifa = ifp; ifa; ifa = ifa->ifa_next) if (ifa->ifa_addr->sa_family == AF_LINK) {
    sdl = (struct sockaddr_dl *)ifa->ifa_addr;
    if (sdl->sdl_alen == 6) i++;
  }

  Local<Array> entries = Array::New(i);

  i = 0;
  for (ifa = ifp; ifa != NULL; ifa = ifa->ifa_next) if (ifa->ifa_addr->sa_family == AF_LINK) {
    sdl = (struct sockaddr_dl *)ifa->ifa_addr;
    if (sdl->sdl_alen != 6) continue;

    char    lladdr[(6 * 3) + 1];
    u_char *ll = (u_char *) LLADDR(sdl);
    snprintf(lladdr, sizeof lladdr, "%02x:%02x:%02x:%02x:%02x:%02x", ll[0], ll[1], ll[2], ll[3], ll[4], ll[5]);

    Local<Object> entry = Object::New();

    entry->Set(NODE_PSYMBOL("name"), String::New(ifa->ifa_name));
    entry->Set(NODE_PSYMBOL("mac"), String::New(lladdr));

    entries->Set(i++, entry);
  }

  freeifaddrs(ifp);

  return scope.Close(entries);
}

extern "C" {
  static void init(Handle<Object> target) {
    HandleScope scope;

    target->Set(String::NewSymbol("arpTable"), FunctionTemplate::New(ArpTable)->GetFunction());
    target->Set(String::NewSymbol("ifTable"),  FunctionTemplate::New(IfTable)->GetFunction());
  }
}

NODE_MODULE(macos, init);
