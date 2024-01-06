import GridPostList from "@/components/shared/GridPostList";
import Loader from "@/components/shared/Loader";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetPosts, useSearchPosts } from "@/lib/react-query/queries";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

type SearchResultsProps = {
  isSearchFetching: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchResults: any;
};

const SearchResults = ({
  isSearchFetching,
  searchResults,
}: SearchResultsProps) => {
  // console.log(searchResults)
  if (isSearchFetching) {
    return <Loader />;
  } else if (searchResults && searchResults.total > 0) {
    return <GridPostList posts={searchResults.documents} />;
  } else {
    return (
      <p className="text-light-4 mt-10 text-center w-full">No results found</p>
    );
  }
};

const Explore = () => {
  const { ref, inView } = useInView();

  const [searchValue, setSearchValue] = useState("");
  const { data: posts, fetchNextPage, hasNextPage } = useGetPosts();
  const debounceSearch = useDebounce(searchValue, 500);
  const { data: searchResults, isFetching: isSearchFetching } =
    useSearchPosts(debounceSearch);
  useEffect(() => {
    if (inView && !searchValue) {
      fetchNextPage();
    }
  }, [inView, searchValue]);

  if (!posts) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  const isShowSearchResults = searchValue !== "";
  const isShowPosts =
    !isShowSearchResults &&
    posts.pages.every((item) => item?.documents.length === 0);
  // console.log(isShowSearchResults)
  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search Posts</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            alt="search"
            width={24}
            height={24}
          />
          <Input
            type="text"
            placeholder="Search"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">Popular Today</h3>
        <div className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2 cursor-pointer">
          <p className="small-medium md:base-medium text-light-2">All</p>
          <img
            src="/assets/icons/filter.svg"
            alt="filter"
            width={20}
            height={20}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-9 w-full max-w-5xl">
        {isShowSearchResults ? (
          <SearchResults
            isSearchFetching={isSearchFetching}
            searchResults={searchResults}
          />
        ) : isShowPosts ? (
          <p className="text-light-4 mt-10 text-center w-full">End of posts</p>
        ) : (
          posts.pages.map((page, index) => (
            <GridPostList posts={page!.documents} key={`page-${index}`} />
          ))
        )}
      </div>

      {hasNextPage && !searchValue && (
        <div className="mt-10" ref={ref}>
          <Loader />
        </div>
      )}
    </div>
  );
};

export default Explore;
