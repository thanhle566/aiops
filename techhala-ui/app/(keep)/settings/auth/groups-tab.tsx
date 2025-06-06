import {
  Title,
  Subtitle,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Button,
  Badge,
  TextInput,
} from "@tremor/react";
import Loading from "@/app/(keep)/loading";
import { useGroups } from "utils/hooks/useGroups";
import { useUsers } from "@/entities/users/model/useUsers";
import { useRoles } from "utils/hooks/useRoles";
import { useState, useEffect, useMemo } from "react";
import GroupsSidebar from "./groups-sidebar";
import { TrashIcon } from "@heroicons/react/24/outline";
import { MdGroupAdd } from "react-icons/md";
import { useApi } from "@/shared/lib/hooks/useApi";

export default function GroupsTab() {
  const api = useApi();
  const {
    data: groups = [],
    isLoading: groupsLoading,
    mutate: mutateGroups,
  } = useGroups();
  const {
    data: users = [],
    isLoading: usersLoading,
    mutate: mutateUsers,
  } = useUsers();
  const { data: roles = [] } = useRoles();

  const [groupStates, setGroupStates] = useState<{
    [key: string]: { members: string[]; roles: string[] };
  }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [isNewGroup, setIsNewGroup] = useState(false);

  useEffect(() => {
    if (groups) {
      const initialGroupStates = groups.reduce(
        (acc, group) => {
          acc[group.id] = {
            members: group.members || [],
            roles: group.roles || [],
          };
          return acc;
        },
        {} as { [key: string]: { members: string[]; roles: string[] } }
      );
      setGroupStates(initialGroupStates);
    }
  }, [groups]);

  const filteredGroups = useMemo(() => {
    return (
      groups?.filter((group) =>
        group.name.toLowerCase().includes(filter.toLowerCase())
      ) || []
    );
  }, [groups, filter]);

  if (groupsLoading || usersLoading || !roles) return <Loading />;

  const handleRowClick = (group: any) => {
    setSelectedGroup(group);
    setIsNewGroup(false);
    setIsSidebarOpen(true);
  };

  const handleAddGroupClick = () => {
    setSelectedGroup(null);
    setIsNewGroup(true);
    setIsSidebarOpen(true);
  };

  const handleDeleteGroup = async (
    groupName: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        await api.delete(`/auth/groups/${groupName}`);

        await mutateGroups();
        await mutateUsers();
      } catch (error) {
        console.error("Error deleting group:", error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="flex flex-col">
          <Title>Groups Management</Title>
          <Subtitle>Manage user groups</Subtitle>
        </div>
        <div className="flex space-x-2">
          <Button
            className="btn-primary"
            size="md"
            onClick={handleAddGroupClick}
            icon={MdGroupAdd}
          >
            Add Group
          </Button>
        </div>
      </div>
      <TextInput
        placeholder="Search by group name"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4"
      />
      <Card className="overflow-auto p-0">
        <div className="h-full w-full overflow-auto">
          <Table className="h-full">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-3/24">Group Name</TableHeaderCell>
                <TableHeaderCell className="w-5/12">Members</TableHeaderCell>
                <TableHeaderCell className="w-5/12">Roles</TableHeaderCell>
                <TableHeaderCell className="w-1/24"></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow
                  key={group.id}
                  className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                  onClick={() => handleRowClick(group)}
                >
                  <TableCell className="w-2/12">{group.name}</TableCell>
                  <TableCell className="w-4/12">
                    <div className="flex flex-wrap gap-1">
                      {group.members.slice(0, 4).map((member, index) => (
                        <Badge key={index}  color="red" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                      {group.members.length > 4 && (
                        <Badge  color="red" className="text-xs">
                          +{group.members.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-4/12">
                    <div className="flex flex-wrap gap-1">
                      {group.roles.slice(0, 4).map((role, index) => (
                        <Badge key={index}  color="red" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                      {group.roles.length > 4 && (
                        <Badge  color="red" className="text-xs">
                          +{group.roles.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-1/24">
                    <Button
                      icon={TrashIcon}
                      variant="light"
                      className="btn-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteGroup(group.name, e)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <GroupsSidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(false)}
        group={selectedGroup}
        isNewGroup={!selectedGroup}
        mutateGroups={mutateGroups}
      />
    </div>
  );
}
